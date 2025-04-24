import type { Document } from "mongoose";

export enum Sex {
  Female = "FEMALE",
  Male = "MALE",
}

type UserDocument = Document & {
  identity: string;
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  provisoryPassword: boolean;
  refreshToken?: string;
  sex: Sex;
  avatar: string | null;
  online: boolean;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export default UserDocument;
