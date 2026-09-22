/**
 * Object-Level Authorization Utilities
 *
 * Answers: "Is THIS user allowed to access THIS specific record?"
 *
 * IDOR (Insecure Direct Object Reference) protection:
 *  A user must not be able to access another user's private data simply
 *  by changing an ID in a URL parameter.
 *
 * Authorization must be enforced on the BACKEND.
 * Frontend visibility controls are NOT the security boundary.
 *
 * Usage pattern:
 *
 *   const expense = await FarmerExpense.findById(req.params.id);
 *   assertOwner(req.user, expense.farmerId); // throws 403 if mismatch
 *
 * ADMIN exception:
 *   Admins may be granted read access to audit-sensitive records.
 *   Use assertOwnerOrAdmin when admin visibility is explicitly required.
 */

import { UserRole } from '../models/User';

interface AuthUser {
  userId: string;
  role:   string;
}

/**
 * Assert that the authenticated user owns this resource.
 * Throws a 403 error if ownership check fails.
 */
export function assertOwner(
  authUser: AuthUser | undefined,
  ownerId: { toString(): string } | string
): void {
  if (!authUser) {
    throw Object.assign(
      new Error('Authentication required.'),
      { statusCode: 401 }
    );
  }

  const ownerStr = typeof ownerId === 'string' ? ownerId : ownerId.toString();

  if (authUser.userId !== ownerStr) {
    throw Object.assign(
      new Error('Access denied. You do not have permission to access this resource.'),
      { statusCode: 403 }
    );
  }
}

/**
 * Assert that the authenticated user owns this resource OR is an admin.
 * Use sparingly — only when admin visibility is explicitly required by design.
 */
export function assertOwnerOrAdmin(
  authUser: AuthUser | undefined,
  ownerId: { toString(): string } | string
): void {
  if (!authUser) {
    throw Object.assign(new Error('Authentication required.'), { statusCode: 401 });
  }

  if (authUser.role === UserRole.ADMIN) return;

  const ownerStr = typeof ownerId === 'string' ? ownerId : ownerId.toString();

  if (authUser.userId !== ownerStr) {
    throw Object.assign(
      new Error('Access denied. You do not have permission to access this resource.'),
      { statusCode: 403 }
    );
  }
}

/**
 * Assert that the authenticated user is one of the listed participants.
 * Used for conversations, transactions, etc. where two parties are involved.
 */
export function assertParticipant(
  authUser: AuthUser | undefined,
  participantIds: Array<{ toString(): string } | string>
): void {
  if (!authUser) {
    throw Object.assign(new Error('Authentication required.'), { statusCode: 401 });
  }

  const isParticipant = participantIds.some(
    (id) => (typeof id === 'string' ? id : id.toString()) === authUser.userId
  );

  if (!isParticipant) {
    throw Object.assign(
      new Error('Access denied. You are not a participant in this resource.'),
      { statusCode: 403 }
    );
  }
}
