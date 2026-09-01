import { atomWithStorage } from "jotai/utils";
import { User } from "../interface/user.interface";

export const userAtom = atomWithStorage<User | null>("currentUser", null);
