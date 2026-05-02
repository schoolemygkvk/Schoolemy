
import mongoose from "mongoose";


export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Execute the callback with the session
    const result = await callback(session);

    // Commit the transaction if everything succeeds
    await session.commitTransaction();

    return result;
  } catch (error) {
    // Abort transaction on any error
    await session.abortTransaction();
    throw error;
  } finally {
    // Always end the session
    session.endSession();
  }
};

export default withTransaction;

