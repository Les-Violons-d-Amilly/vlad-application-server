import express, { Router } from "express";
import Joi from "joi";
import multer from "multer";
import Stripe from "stripe";
import calculatePrice from "../utils/calculatePrice";
import {
  ParsedStudent,
  ParsedTeacher,
  parseStudentCsv,
  parseTeacherCsv,
} from "../utils/parseCsv";
import School from "../model/School";
import { registerManyTeachers, registerManyUsers } from "../service/user";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const router = Router();
const upload = multer();

type SchoolData = {
  name: string;
  email: string;
  teachers: ParsedTeacher[];
  students: ParsedStudent[];
  groups: string[];
  managedBy: string[];
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

const schoolsMap = new Map<string, SchoolData>();

router.post(
  "/",
  upload.fields([
    { name: "teachers", maxCount: 1 },
    { name: "students", maxCount: 1 },
  ]),
  async (req, res) => {
    const { error, value } = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      groups: Joi.array().items(Joi.string()).optional().required(),
      managedBy: Joi.array().items(Joi.string().hex()).required(),
      paymentMethodId: Joi.string().required(),
    }).validate(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { name, email, groups, managedBy } = value;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const teachersBuffer = files?.["teachers"]?.[0]?.buffer;
    const studentsBuffer = files?.["students"]?.[0]?.buffer;

    if (!teachersBuffer || !studentsBuffer) {
      res.status(400).json({ error: "Teachers or students file is missing" });
      return;
    }

    const [students, teachers] = await Promise.all([
      parseStudentCsv(studentsBuffer),
      parseTeacherCsv(teachersBuffer),
    ]);

    const schoolId = crypto.randomUUID();

    try {
      const customer = await stripe.customers.create({
        name,
        email,
        payment_method: value.paymentMethodId,
        invoice_settings: {
          default_payment_method: value.paymentMethodId,
        },
      });

      const product = await stripe.products.create({
        name: `Subscription for ${name} (${students.length} students, ${teachers.length} teachers)`,
        metadata: { schoolId },
      });

      const price = await stripe.prices.create({
        unit_amount: calculatePrice(students.length, teachers.length),
        currency: "eur",
        recurring: { interval: "month" },
        product: product.id,
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_settings: {
          payment_method_types: ["card"],
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
        metadata: { schoolId },
      });

      const invoice = subscription.latest_invoice as
        | (Stripe.Invoice & {
            payment_intent: Stripe.PaymentIntent;
          })
        | null;

      if (!invoice) {
        res.status(500).json({ error: "Failed to create subscription" });
        return;
      }

      const clientSecret = invoice.payment_intent.client_secret;

      schoolsMap.set(schoolId, {
        name,
        email,
        teachers,
        students,
        groups,
        managedBy,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
      });

      res.status(201).json({
        message: "School created successfully",
        payment: {
          subscriptionId: subscription.id,
          clientSecret,
        },
        schoolId,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  }
);

router.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const event = req.body as Stripe.Event;

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const schoolId = paymentIntent.metadata.schoolId;
        const schoolData = schoolsMap.get(schoolId);

        if (!schoolData) {
          console.log(`School with ID ${schoolId} not found`);
          res.sendStatus(404);
          return;
        }

        const {
          name,
          email,
          teachers,
          students,
          groups,
          managedBy,
          stripeCustomerId,
          stripeSubscriptionId,
        } = schoolData;

        const [registeredStudents, registeredTeachers] = await Promise.all([
          registerManyUsers(students),
          registerManyTeachers(teachers),
        ]);

        try {
          await School.create({
            name,
            email,
            teachers: registeredTeachers,
            students: registeredStudents,
            groups,
            managedBy,
            stripeCustomerId,
            stripeSubscriptionId,
          });
        } catch (error) {
          console.error("Error creating school:", error);
          schoolsMap.delete(schoolId);
          res.status(500).json({ error: "Failed to create school" });
          return;
        }

        schoolsMap.delete(schoolId);
        console.log(`Payment succeeded for school ${name}. School data saved.`);
        res.sendStatus(200);
        break;

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        const failedSchoolId = failedPaymentIntent.metadata.schoolId;
        const failedSchoolData = schoolsMap.get(failedSchoolId);

        if (!failedSchoolData) {
          console.log(`School with ID ${failedSchoolId} not found`);
          res.sendStatus(404);
          return;
        }

        schoolsMap.delete(failedSchoolId);
        console.log(
          `Payment failed for school ${failedSchoolData.name}. School data deleted.`
        );

        res.sendStatus(200);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }
  }
);

export default router;
