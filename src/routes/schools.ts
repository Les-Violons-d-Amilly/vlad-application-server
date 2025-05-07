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
import School, { SchoolDocument } from "../model/School";
import { registerManyTeachers, registerManyUsers } from "../service/user";
import randomPassword from "../utils/randomPassword";
import EventEmitter from "events";
import sendEmail from "../utils/sendEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const router = Router();
const upload = multer();

type SchoolData = {
  siret: string;
  name: string;
  email: string;
  teachers: ParsedTeacher[];
  students: ParsedStudent[];
  managedBy: number[];
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

type ListenerResult =
  | {
      error: false;
      message: string;
      data: { schoolId: string };
    }
  | {
      error: true;
      message: string;
      data: null;
    };

const TOLERATED_ACTIVITY = {
  "85.52Z": "Enseignement culturel",
  "90.01Z": "Arts du spectacle vivant",
};

const schoolsMap = new Map<string, SchoolData>();
const siretResponseCache = new Map<string, Response>();
const emailCodes = new Map<string, string>();
const schoolEvents = new EventEmitter();

router.post(
  "/",
  upload.fields([
    { name: "teachers", maxCount: 1 },
    { name: "students", maxCount: 1 },
  ]),
  async (req, res) => {
    /**
     * @openapi
     * /api/schools:
     *   post:
     *     tags:
     *       - Schools
     *     summary: Create a new school
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               data:
     *                 type: string
     *                 format: json
     *               teachers:
     *                 type: string
     *                 format: binary
     *               students:
     *                 type: string
     *                 format: binary
     */
    const { error, value } = Joi.object({
      siret: Joi.string().required().length(14),
      name: Joi.string().min(3).max(100).required(),
      email: Joi.string().email().required(),
      managedBy: Joi.array().items(Joi.number()).required(),
      paymentMethodId: Joi.string().required(),
    }).validate(JSON.parse(req.body.data));

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { name, email, managedBy, siret } = value;
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
        metadata: { schoolId },
      });

      schoolsMap.set(schoolId, {
        siret,
        name,
        email,
        teachers,
        students,
        managedBy,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
      });

      const listener = async (result: ListenerResult) => {
        if (result.error) {
          console.log(`Payment failed for school ${name}.`);

          schoolsMap.delete(schoolId);
          res.status(400).json({
            error: "Payment failed",
            message: result.message,
          });

          return;
        }

        res.status(201).json({
          message: "School created successfully",
          subscriptionId: subscription.id,
          schoolId: result.data.schoolId,
        });
      };

      schoolEvents.once(`payment_result:${subscription.id}`, listener);

      setTimeout(() => {
        schoolEvents.removeListener(
          `payment_result:${subscription.id}`,
          listener
        );

        schoolsMap.delete(schoolId);

        res.status(400).json({
          error: "Payment failed or timed out",
        });
      }, 600_000);
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
    /**
     * @openapi
     * /api/schools/payment/webhook:
     *   post:
     *     tags:
     *       - Schools
     *     summary: Stripe webhook for payment events
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: string
     *               object:
     *                 type: string
     */
    let event: Stripe.Event = req.body;

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const subscriptionId = event.data.object.parent?.subscription_details
          ?.subscription as string | null;

        if (!subscriptionId) {
          console.log("No subscription ID found in the event data");
          res.sendStatus(400);

          schoolEvents.emit(`payment_result:${subscriptionId}`, {
            error: true,
            message: "No subscription ID found",
            data: null,
          });

          return;
        }

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );

        const schoolId = subscription.metadata.schoolId;
        const schoolData = schoolsMap.get(schoolId);

        if (!schoolData) {
          console.log(`School with ID ${schoolId} not found`);
          res.sendStatus(404);

          schoolEvents.emit(`payment_result:${subscriptionId}`, {
            error: true,
            message: "School not found",
            data: null,
          });

          return;
        }

        const {
          siret,
          name,
          email,
          teachers,
          students,
          managedBy,
          stripeCustomerId,
          stripeSubscriptionId,
        } = schoolData;

        const groups = [
          ...new Set(
            students.map((s) => s.group.trim().replace(/\s{2,}/g, " "))
          ),
        ];

        const [registeredStudents, registeredTeachers] = await Promise.all([
          registerManyUsers(students),
          registerManyTeachers(teachers),
        ]);

        const managedByIds = managedBy.map(
          (teacherIndex) => registeredTeachers[teacherIndex]
        );

        let school: SchoolDocument;

        try {
          school = await School.create({
            siret,
            name,
            email,
            teachers: registeredTeachers,
            students: registeredStudents,
            managedBy: managedByIds,
            groups,
            stripeCustomerId,
            stripeSubscriptionId,
          });
        } catch (error) {
          console.error("Error creating school:", error);
          schoolsMap.delete(schoolId);
          res.status(500).json({ error: "Failed to create school" });

          schoolEvents.emit(`payment_result:${subscriptionId}`, {
            error: true,
            message: "Failed to create school",
            data: null,
          });

          return;
        }

        schoolsMap.delete(schoolId);
        console.log(`Payment succeeded for school ${name}. School data saved.`);
        res.sendStatus(200);

        schoolEvents.emit(`payment_result:${subscriptionId}`, {
          error: false,
          message: "Payment succeeded",
          data: { schoolId: school.id },
        });

        sendEmail(
          email,
          "Inscription réussie",
          /* html */ `
          <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Bonjour,</p>
          <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
            Votre inscription a été validée avec succès.
          </p>
          <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
            Voici les informations de votre école :
          </p>
          <ul style="font-family: Arial, sans-serif; font-size: 16px; color: #333; padding-left: 20px;">
            <li><strong style="color: #000;">Nom :</strong> ${name}</li>
            <li><strong style="color: #000;">Email :</strong> ${email}</li>
            <li><strong style="color: #000;">Nombre d'élèves :</strong> ${students.length}</li>
            <li><strong style="color: #000;">Nombre de professeurs :</strong> ${teachers.length}</li>
          </ul>
          <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Cordialement,</p>
          <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">L'équipe de Vlad</p>`
        );

        break;
      }

      case "invoice.payment_failed": {
        const subscriptionId = event.data.object.parent?.subscription_details
          ?.subscription as string | null;

        if (!subscriptionId) {
          console.log("No subscription ID found in the event data");
          res.sendStatus(400);

          schoolEvents.emit(`payment_result:${subscriptionId}`, {
            error: true,
            message: "No subscription ID found",
            data: null,
          });

          return;
        }

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );

        const schoolId = subscription.metadata.schoolId;
        const failedSchoolData = schoolsMap.get(schoolId);

        if (!failedSchoolData) {
          console.log(`School with ID ${schoolId} not found`);
          res.sendStatus(404);

          schoolEvents.emit(`payment_result:${subscriptionId}`, {
            error: true,
            message: "School not found",
            data: null,
          });

          return;
        }

        schoolsMap.delete(schoolId);
        console.log(
          `Payment failed for school ${failedSchoolData.name}. School data deleted.`
        );

        res.sendStatus(200);

        schoolEvents.emit(`payment_result:${subscriptionId}`, {
          error: true,
          message: "Payment failed",
          data: null,
        });

        break;
      }

      default:
        res.sendStatus(400);
        break;
    }
  }
);

router.get("/validate/email/:email", async (req, res) => {
  /**
   * @openapi
   * /api/schools/validate/email/{email}:
   *   get:
   *     tags:
   *       - Schools
   *     summary: Validate an email address
   *     parameters:
   *       - name: email
   *         in: path
   *         required: true
   *         description: Email address to validate
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Email sent successfully
   */
  if (!req.params.email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const code = randomPassword(6, {
    lowercase: false,
    uppercase: false,
    numbers: true,
    symbols: false,
  });

  emailCodes.set(req.params.email, code);

  setTimeout(() => {
    emailCodes.delete(req.params.email);
  }, 600_000);

  await sendEmail(
    req.params.email,
    "Code de validation de l'adresse email",
    /* html */ `
    <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Bonjour,</p>
    <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
      Voici le code de validation pour votre adresse email :
      <strong style="color: #2a9d8f; font-weight: bold;">${code}</strong>
    </p>
    <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
      Le code est valide pendant 10 minutes.
    </p>
    <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
      Merci de ne pas partager ce code avec qui que ce soit.
    </p>
    <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Cordialement,</p>
    <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">L'équipe de Vlad</p>`
  );

  res.status(200).json({ message: "Email sent successfully" });
});

router.get("/validate/email/:email/:code", async (req, res) => {
  /**
   * @openapi
   * /api/schools/validate/email/{email}/{code}:
   *   get:
   *     tags:
   *       - Schools
   *     summary: Validate an email address with a code
   *     parameters:
   *       - name: email
   *         in: path
   *         required: true
   *         description: Email address to validate
   *         schema:
   *           type: string
   *       - name: code
   *         in: path
   *         required: true
   *         description: Validation code sent to the email address
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Email validated successfully
   */
  if (!req.params.email || !req.params.code) {
    res.status(400).json({ error: "Email and code are required" });
    return;
  }

  const { email, code } = req.params;
  const storedCode = emailCodes.get(email);

  if (!storedCode) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  if (storedCode !== code) {
    res.status(400).json({ error: "Invalid code" });
    return;
  }

  emailCodes.delete(email);
  res.status(200).json({ message: "Email validated successfully" });
});

router.get("/validate/siret/:siret", async (req, res) => {
  /**
   * @openapi
   * /api/schools/validate/siret/{siret}:
   *   get:
   *     tags:
   *       - Schools
   *     summary: Validate a SIRET number
   *     parameters:
   *       - name: siret
   *         in: path
   *         required: true
   *         description: SIRET number to validate
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: SIRET number is valid
   */
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

router.post("/preview/students", upload.single("file"), async (req, res) => {
  /**
   * @openapi
   * /api/schools/preview/students:
   *   post:
   *     tags:
   *       - Schools
   *     summary: Preview students from a CSV file
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: Parsed students successfully
   */
  if (!req.file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }

  if (!/csv/i.test(req.file.mimetype)) {
    res.status(400).json({ message: "Invalid file type" });
    return;
  }

  const students = await parseStudentCsv(req.file.buffer);

  res.status(200).json({
    message: `Parsed ${students.length} students`,
    students,
  });
});

router.post("/preview/teachers", upload.single("file"), async (req, res) => {
  /**
   * @openapi
   * /api/schools/preview/teachers:
   *   post:
   *     tags:
   *       - Schools
   *     summary: Preview teachers from a CSV file
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: Parsed teachers successfully
   */
  if (!req.file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }

  if (!/csv/i.test(req.file.mimetype)) {
    res.status(400).json({ message: "Invalid file type" });
    return;
  }

  const teachers = await parseTeacherCsv(req.file.buffer);

  res.status(200).json({
    message: `Parsed ${teachers.length} teachers`,
    teachers,
  });
});

export default router;
