import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import type UserDocument from "./User";
import { Sex } from "./User";
import { LevelResultDocument } from "./LevelResult";

type DurationPerDate = {
  date: string;
  duration: number;
};

export interface StudentDocument extends UserDocument {
  birthdate: Date;
  group: string;
  timeOnApp: DurationPerDate[];
  levelResults: LevelResultDocument[];
}

const StudentSchema = new Schema<StudentDocument>(
  {
    identity: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    hash: { type: String, required: true },
    provisoryPassword: { type: Boolean, default: true },
    refreshToken: { type: String, required: false },
    avatar: { type: String, default: null, required: false },
    birthdate: { type: Date, required: true },
    sex: { type: String, enum: Sex, required: true },
    group: { type: String, required: false },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    levelResults: [
      {
        type: Schema.Types.ObjectId,
        ref: "LevelResult",
        required: false,
      },
    ],
    timeOnApp: {
      type: [
        {
          date: { type: String, required: true },
          duration: { type: Number, required: true },
        },
      ],
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
    id: true,
    methods: {
      verifyPassword: async function (password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.hash);
      },
    },
  }
);

StudentSchema.pre("save", async function (next) {
  if (!this.isModified("hash")) return next();
  this.hash = await bcrypt.hash(this.hash, 8);
  next();
});

StudentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default model<StudentDocument>("Student", StudentSchema);
