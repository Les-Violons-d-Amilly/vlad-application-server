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
  managedBy: string[];
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

type SiretReponseHeader = {
  statut: number;
  message: string;
};

type SiretResponseEtablissementUniteLegale = {
  etatAdministratifUniteLegale: string;
  statutDiffusionUniteLegale: string;
  categorieJuridiqueUniteLegale: string;
  denominationUniteLegale: string;
  sigleUniteLegale: string | null;
  denominationUsuelle1UniteLegale: string | null;
  denominationUsuelle2UniteLegale: string | null;
  denominationUsuelle3UniteLegale: string | null;
  sexeUniteLegale: string | null;
  nomUniteLegale: string | null;
  nomUsageUniteLegale: string | null;
  prenom1UniteLegale: string | null;
  prenom2UniteLegale: string | null;
  prenom3UniteLegale: string | null;
  prenom4UniteLegale: string | null;
  prenomUsuelUniteLegale: string | null;
  activitePrincipaleUniteLegale: string;
  nomenclatureActivitePrincipaleUniteLegale: string;
  identifiantAssociationUniteLegale: string | null;
  economieSocialeSolidaireUniteLegale: string | null;
  societeMissionUniteLegale: string | null;
  caractereEmployeurUniteLegale: string | null;
  trancheEffectifsUniteLegale: string | null;
  anneeEffectifsUniteLegale: string | null;
  nicSiegeUniteLegale: string | null;
  dateDernierTraitementUniteLegale: string;
  categorieEntreprise: string | null;
  anneeCategorieEntreprise: string | null;
};

type SiretResponseAdresseEtablissement = {
  complementAdresseEtablissement: string | null;
  numeroVoieEtablissement: string | null;
  indiceRepetitionEtablissement: string | null;
  dernierNumeroVoieEtablissement: string | null;
  indiceRepetitionDernierNumeroVoieEtablissement: string | null;
  typeVoieEtablissement: string | null;
  libelleVoieEtablissement: string | null;
  codePostalEtablissement: string | null;
  libelleCommuneEtablissement: string | null;
  libelleCommuneEtrangerEtablissement: string | null;
  distributionSpecialeEtablissement: string | null;
  codeCommuneEtablissement: string | null;
  codeCedexEtablissement: string | null;
  libelleCedexEtablissement: string | null;
  codePaysEtrangerEtablissement: string | null;
  libellePaysEtrangerEtablissement: string | null;
  identifiantAdresseEtablissement: string | null;
  coordonneeLambertAbscisseEtablissement: string | null;
  coordonneeLambertOrdonneeEtablissement: string | null;
};

type SiretResponsePeriodeEtablissement = {
  dateFin: null;
  dateDebut: string;
  etatAdministratifEtablissement: string;
  changementEtatAdministratifEtablissement: boolean;
  enseigne1Etablissement: string | null;
  enseigne2Etablissement: string | null;
  enseigne3Etablissement: string | null;
  changementEnseigneEtablissement: boolean;
  denominationUsuelleEtablissement: string | null;
  changementDenominationUsuelleEtablissement: boolean;
  activitePrincipaleEtablissement: string;
  nomenclatureActivitePrincipaleEtablissement: string;
  changementActivitePrincipaleEtablissement: boolean;
  caractereEmployeurEtablissement: string;
  changementCaractereEmployeurEtablissement: boolean;
};

type SiretResponseEtablissement = {
  siren: string;
  nic: string;
  siret: string;
  statutDiffusionEtablissement: string;
  dateCreationEtablissement: string;
  trancheEffectifsEtablissement: string | null;
  anneeEffectifsEtablissement: string | null;
  etablissementSiege: boolean;
  nombrePeriodesEtablissement: number;
  uniteLegale: SiretResponseEtablissementUniteLegale;
  adresseEtablissement: SiretResponseAdresseEtablissement;
  adresse2Etablissement: SiretResponseAdresseEtablissement | null;
  periodesEtablissement: SiretResponsePeriodeEtablissement[];
};

type SiretResponse = {
  header: SiretReponseHeader;
  etablissement: SiretResponseEtablissement;
};

const TOLERATED_ACTIVITY = {
  "85.52Z": "Enseignement culturel",
  "90.01Z": "Arts du spectacle vivant",
};

const schoolsMap = new Map<string, SchoolData>();
const siretResponseCache = new Map<string, Response>();

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
      managedBy: Joi.array().items(Joi.string().hex()).required(),
      paymentMethodId: Joi.string().required(),
    }).validate(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { name, email, managedBy } = value;
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

router.get("/validate/siret/:siret", async (req, res) => {
  if (!req.params.siret) {
    res.status(400).json({ error: "SIRET number is required" });
    return;
  }

  let response = siretResponseCache.get(req.params.siret);

  if (!response) {
    response = await fetch(
      `https://api.insee.fr/api-sirene/3.11/siret/${req.params.siret}`,
      {
        method: "GET",
        headers: {
          "X-INSEE-Api-Key-Integration": process.env.INSEE_SIREN_API_KEY!,
          Accept: "application/json",
        },
      }
    );
  }

  if (!response.ok) {
    res.status(400).json({ error: "Invalid SIRET number", code: 601 });
    return;
  }

  const data: SiretResponse = await response.json();

  if (
    !(
      data.etablissement.uniteLegale.activitePrincipaleUniteLegale in
      TOLERATED_ACTIVITY
    )
  ) {
    res.status(400).json({
      error: "The activity of the establishment is not tolerated",
      code: 602,
    });

    return;
  }

  res.status(200).json({
    name: data.etablissement.uniteLegale.denominationUniteLegale,
    dateCreation: data.etablissement.dateCreationEtablissement,
    activityCode: data.etablissement.uniteLegale.activitePrincipaleUniteLegale,
    activityLabel: (TOLERATED_ACTIVITY as Record<string, string>)[
      data.etablissement.uniteLegale.activitePrincipaleUniteLegale
    ],
    address: {
      street: data.etablissement.adresseEtablissement.libelleVoieEtablissement,
      zipCode: data.etablissement.adresseEtablissement.codePostalEtablissement,
      city: data.etablissement.adresseEtablissement.libelleCommuneEtablissement,
    },
  });
});

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
          managedBy,
          stripeCustomerId,
          stripeSubscriptionId,
        } = schoolData;

        const groups = [...new Set(students.map((s) => s.group))];

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
