import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  requestUploadUrlInputSchema, 
  finalizeUploadInputSchema, 
  getFileBySlugInputSchema 
} from './schema';
import { requestUploadUrl } from './handlers/request_upload_url';
import { finalizeUpload } from './handlers/finalize_upload';
import { getFileBySlug } from './handlers/get_file_by_slug';
import { getUploadCount } from './handlers/get_upload_count';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Request a signed upload URL for direct upload to object storage
  requestUploadUrl: publicProcedure
    .input(requestUploadUrlInputSchema)
    .mutation(({ input }) => requestUploadUrl(input)),
    
  // Finalize upload by storing file metadata in database
  finalizeUpload: publicProcedure
    .input(finalizeUploadInputSchema)
    .mutation(({ input }) => finalizeUpload(input)),
    
  // Get file information by slug for sharing links
  getFileBySlug: publicProcedure
    .input(getFileBySlugInputSchema)
    .query(({ input }) => getFileBySlug(input)),
    
  // Get total count of uploaded files for display
  getUploadCount: publicProcedure
    .query(() => getUploadCount()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Earl Box TRPC server listening at port: ${port}`);
}

start();