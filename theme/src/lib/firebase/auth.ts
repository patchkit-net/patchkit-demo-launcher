import * as FirebaseAuth from "firebase/auth";

import { firebaseApp } from "./app";

export const firebaseAuth = FirebaseAuth.getAuth(firebaseApp);
