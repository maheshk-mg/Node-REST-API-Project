import { connectTestDb, disconnectTestDb } from "./setup.js";

before(async () => {
  await connectTestDb();
});

after(async () => {
  await disconnectTestDb();
});
