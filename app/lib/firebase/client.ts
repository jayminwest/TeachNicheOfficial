import { firestore, auth } from '@/app/services/firebase';

export function createClient() {
  return {
    firestore,
    auth,
    from: (collection: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {},
            error: null
          })
        }),
        match: () => ({
          single: async () => ({
            data: {},
            error: null
          })
        }),
        order: () => ({
          data: [],
          error: null
        })
      }),
      insert: () => ({
        data: { id: 'new-id' },
        error: null
      }),
      update: () => ({
        data: { id: 'updated-id' },
        error: null
      }),
      delete: () => ({
        error: null
      })
    })
  };
}

export function createRouteHandlerClient() {
  return createClient();
}
