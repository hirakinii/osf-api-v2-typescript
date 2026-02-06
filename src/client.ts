import { HttpClient } from './network/HttpClient';
import { Nodes } from './resources/Nodes';
import { Files } from './resources/Files';
import { Users } from './resources/Users';
import { Registrations } from './resources/Registrations';
import { Contributors } from './resources/Contributors';
import { Institutions } from './resources/Institutions';

/**
 * Configuration options for the OSF client
 */
export interface OsfClientConfig {
  /** Personal access token for authentication */
  token: string;
  /** Base URL for the API (defaults to https://api.osf.io/v2/) */
  baseUrl?: string;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;
}

/**
 * Main entry point for the OSF API v2 client
 *
 * Provides access to all API resources through a unified interface.
 * Resource instances are lazily created on first access.
 *
 * @example
 * ```typescript
 * const client = new OsfClient({ token: 'your-token' });
 *
 * // Access resources
 * const me = await client.users.me();
 * const nodes = await client.nodes.listNodes();
 * const files = await client.files.listByNode('abc12');
 * ```
 */
export class OsfClient {
  private httpClient: HttpClient;

  private _nodes?: Nodes;
  private _files?: Files;
  private _users?: Users;
  private _registrations?: Registrations;
  private _contributors?: Contributors;
  private _institutions?: Institutions;

  /**
   * Create a new OSF client
   *
   * @param config - Client configuration
   */
  constructor(config: OsfClientConfig) {
    this.httpClient = new HttpClient({
      token: config.token,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
    });
  }

  /**
   * Access the Nodes resource
   *
   * Provides methods for working with OSF nodes (projects, components, etc.)
   */
  get nodes(): Nodes {
    if (!this._nodes) {
      this._nodes = new Nodes(this.httpClient);
    }
    return this._nodes;
  }

  /**
   * Access the Files resource
   *
   * Provides methods for working with files and file metadata
   */
  get files(): Files {
    if (!this._files) {
      this._files = new Files(this.httpClient);
    }
    return this._files;
  }

  /**
   * Access the Users resource
   *
   * Provides methods for working with user profiles
   */
  get users(): Users {
    if (!this._users) {
      this._users = new Users(this.httpClient);
    }
    return this._users;
  }

  /**
   * Access the Registrations resource
   *
   * Provides methods for working with OSF registrations (frozen, time-stamped project snapshots)
   */
  get registrations(): Registrations {
    if (!this._registrations) {
      this._registrations = new Registrations(this.httpClient);
    }
    return this._registrations;
  }

  /**
   * Access the Contributors resource
   *
   * Provides methods for managing contributors on nodes and registrations
   */
  get contributors(): Contributors {
    if (!this._contributors) {
      this._contributors = new Contributors(this.httpClient);
    }
    return this._contributors;
  }

  /**
   * Access the Institutions resource
   *
   * Provides methods for working with research institutions and their affiliations
   */
  get institutions(): Institutions {
    if (!this._institutions) {
      this._institutions = new Institutions(this.httpClient);
    }
    return this._institutions;
  }
}
