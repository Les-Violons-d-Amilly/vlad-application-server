import UserDocument from "../../model/User";
import { PermissionLevel } from "../../utils/authentication";

declare global {
  namespace Express {
    interface Request {
      user: UserDocument;
      permissionLevel: PermissionLevel;
    }
  }
}
