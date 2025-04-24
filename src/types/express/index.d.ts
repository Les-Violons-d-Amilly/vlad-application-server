import UserDocument from "../../model/User";

declare global {
  namespace Express {
    interface Request {
      user: UserDocument;
    }
  }
}
