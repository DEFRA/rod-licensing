// Run multiple validators and merge errors
export const runValidators = (validators, payload) => {
  const errors = validators
    .map((validator) => {
      try {
        validator(payload);
        return null;
      } catch (err) {
        return err;
      }
    })
    .filter(Boolean);

  if (errors.length === 0) {
    return;
  }

  if (errors.length === 1) {
    throw errors[0];
  }

  const mergedDetails = errors.flatMap((e) => (Array.isArray(e.details) ? e.details : []));
  const error = new Error("expected error");
  error.details = mergedDetails;
  throw error;
};
