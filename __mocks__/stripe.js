// __mocks__/stripe.js
module.exports = function() {
  return {
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'test_session_id',
          url: 'https://checkout.stripe.com/test',
          payment_status: 'unpaid',
          customer: 'cus_123',
          metadata: {}
        })
      }
    }
  };
};
