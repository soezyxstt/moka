import { createSafeActionClient } from 'next-safe-action';

export const actionClient = createSafeActionClient({
  // Can also be an async function.
  handleServerError(e, utils) {
    // You can access these properties inside the `utils` object.
    const { clientInput, bindArgsClientInputs, metadata, ctx } = utils;

    console.log('Client Input:', clientInput);
    console.log('Bind Args Client Inputs:', bindArgsClientInputs);
    console.log('Metadata:', metadata);
    console.log('Context:', ctx);

    // Log to console.
    console.error('Action error:', e.message);

    // Return generic message
    return 'Oh no, something went wrong!';
  },
});
