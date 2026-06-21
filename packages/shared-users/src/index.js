// User & role administration service surface. The unified UsersAdmin screen
// lives in apps/engine; the underlying mutations are the shared identity
// helpers re-exported here so future shared screens have one import path.
export {
  subscribeOrgUsers,
  setUserStatus,
  setUserRole,
  setAppRole,
  setAppAccess,
} from '@unified/shared-auth'
