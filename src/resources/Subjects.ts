import { BaseResource } from './BaseResource';
import { TransformedResource, TransformedList } from '../adapter/JsonApiAdapter';
import { PaginatedResult } from '../pagination/PaginatedResult';
import { OsfSubjectAttributes, SubjectListParams } from '../types/subject';

/**
 * Subjects resource class for interacting with OSF taxonomy subject endpoints
 *
 * Subjects categorize content on the OSF. They are hierarchical,
 * with parent and child relationships for fine-grained classification.
 *
 * @example
 * ```typescript
 * const subjects = new Subjects(httpClient);
 *
 * // Get a subject by ID
 * const subject = await subjects.getById('subj123');
 *
 * // List all subjects
 * const allSubjects = await subjects.listSubjects();
 *
 * // List child subjects
 * const children = await subjects.listChildren('parent123');
 * ```
 */
export class Subjects extends BaseResource {
  /**
   * Get a subject by its ID
   *
   * @param id - The unique identifier of the subject
   * @returns The subject resource
   * @throws {OsfNotFoundError} If subject is not found
   * @throws {OsfPermissionError} If user lacks read access
   */
  async getById(id: string): Promise<TransformedResource<OsfSubjectAttributes>> {
    return super.get<OsfSubjectAttributes>(`subjects/${id}/`);
  }

  /**
   * List available taxonomy subjects
   *
   * Returns top-level subjects by default. Use filter parameters
   * to search by text or filter by parent subject.
   *
   * @param params - Optional filter and pagination parameters
   * @returns List of subjects
   */
  async listSubjects(params?: SubjectListParams): Promise<TransformedList<OsfSubjectAttributes>> {
    return super.list<OsfSubjectAttributes>('subjects/', params);
  }

  /**
   * List subjects with automatic pagination support
   *
   * Returns a PaginatedResult that can iterate through all pages automatically.
   *
   * @param params - Optional filter and pagination parameters
   * @returns PaginatedResult with async iteration support
   */
  async listSubjectsPaginated(params?: SubjectListParams): Promise<PaginatedResult<OsfSubjectAttributes>> {
    return super.listPaginated<OsfSubjectAttributes>('subjects/', params);
  }

  /**
   * List child subjects for a given subject
   *
   * Returns all immediate child taxonomy subjects of the specified parent subject.
   *
   * @param id - The unique identifier of the parent subject
   * @returns List of child subjects
   * @throws {OsfNotFoundError} If parent subject is not found
   */
  async listChildren(id: string): Promise<TransformedList<OsfSubjectAttributes>> {
    return super.list<OsfSubjectAttributes>(`subjects/${id}/children/`);
  }
}
