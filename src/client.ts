import { HttpClient } from './network/HttpClient';
import { Nodes } from './resources/Nodes';
import { Files } from './resources/Files';
import { Users } from './resources/Users';
import { Registrations } from './resources/Registrations';
import { Contributors } from './resources/Contributors';
import { Institutions } from './resources/Institutions';
import { Preprints } from './resources/Preprints';
import { DraftRegistrations } from './resources/DraftRegistrations';
import { Collections } from './resources/Collections';
import { Wikis } from './resources/Wikis';
import { Comments } from './resources/Comments';
import { Logs } from './resources/Logs';
import { Subjects } from './resources/Subjects';
import { Licenses } from './resources/Licenses';
import { ViewOnlyLinks } from './resources/ViewOnlyLinks';
import { Identifiers } from './resources/Identifiers';
import { Citations } from './resources/Citations';
import { PreprintProviders } from './resources/PreprintProviders';
import { RegistrationProviders } from './resources/RegistrationProviders';
import { CollectionProviders } from './resources/CollectionProviders';

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
  private _preprints?: Preprints;
  private _draftRegistrations?: DraftRegistrations;
  private _collections?: Collections;
  private _wikis?: Wikis;
  private _comments?: Comments;
  private _logs?: Logs;
  private _subjects?: Subjects;
  private _licenses?: Licenses;
  private _viewOnlyLinks?: ViewOnlyLinks;
  private _identifiers?: Identifiers;
  private _citations?: Citations;
  private _preprintProviders?: PreprintProviders;
  private _registrationProviders?: RegistrationProviders;
  private _collectionProviders?: CollectionProviders;

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

  /**
   * Access the Preprints resource
   *
   * Provides methods for working with preprints (scholarly works shared before peer review)
   */
  get preprints(): Preprints {
    if (!this._preprints) {
      this._preprints = new Preprints(this.httpClient);
    }
    return this._preprints;
  }

  /**
   * Access the Draft Registrations resource
   *
   * Provides methods for working with draft registrations (editable registration drafts before archiving)
   */
  get draftRegistrations(): DraftRegistrations {
    if (!this._draftRegistrations) {
      this._draftRegistrations = new DraftRegistrations(this.httpClient);
    }
    return this._draftRegistrations;
  }

  /**
   * Access the Collections resource
   *
   * Provides methods for grouping and curating content (nodes, registrations, preprints)
   */
  get collections(): Collections {
    if (!this._collections) {
      this._collections = new Collections(this.httpClient);
    }
    return this._collections;
  }

  /**
   * Access the Wikis resource
   *
   * Provides methods for working with wiki pages and their version history
   */
  get wikis(): Wikis {
    if (!this._wikis) {
      this._wikis = new Wikis(this.httpClient);
    }
    return this._wikis;
  }

  /**
   * Access the Comments resource
   *
   * Provides methods for working with comments on nodes (discussions, replies)
   */
  get comments(): Comments {
    if (!this._comments) {
      this._comments = new Comments(this.httpClient);
    }
    return this._comments;
  }

  /**
   * Access the Logs resource
   *
   * Provides methods for working with activity logs (permanent immutable records of node history)
   */
  get logs(): Logs {
    if (!this._logs) {
      this._logs = new Logs(this.httpClient);
    }
    return this._logs;
  }

  /**
   * Access the Subjects resource
   *
   * Provides methods for working with taxonomy subjects (hierarchical categorization of content)
   */
  get subjects(): Subjects {
    if (!this._subjects) {
      this._subjects = new Subjects(this.httpClient);
    }
    return this._subjects;
  }

  /**
   * Access the Licenses resource
   *
   * Provides methods for working with licenses (terms under which content is shared)
   */
  get licenses(): Licenses {
    if (!this._licenses) {
      this._licenses = new Licenses(this.httpClient);
    }
    return this._licenses;
  }

  /**
   * Access the View Only Links resource
   *
   * Provides methods for working with view-only links (sharing read-only access to private nodes)
   */
  get viewOnlyLinks(): ViewOnlyLinks {
    if (!this._viewOnlyLinks) {
      this._viewOnlyLinks = new ViewOnlyLinks(this.httpClient);
    }
    return this._viewOnlyLinks;
  }

  /**
   * Access the Identifiers resource
   *
   * Provides methods for working with identifiers (DOIs, ARKs, and other permanent references)
   */
  get identifiers(): Identifiers {
    if (!this._identifiers) {
      this._identifiers = new Identifiers(this.httpClient);
    }
    return this._identifiers;
  }

  /**
   * Access the Citations resource
   *
   * Provides methods for working with citation styles (APA, MLA, Chicago, etc.)
   */
  get citations(): Citations {
    if (!this._citations) {
      this._citations = new Citations(this.httpClient);
    }
    return this._citations;
  }

  /**
   * Access the Preprint Providers resource
   *
   * Provides methods for working with preprint providers (services hosting preprints on OSF)
   */
  get preprintProviders(): PreprintProviders {
    if (!this._preprintProviders) {
      this._preprintProviders = new PreprintProviders(this.httpClient);
    }
    return this._preprintProviders;
  }

  /**
   * Access the Registration Providers resource
   *
   * Provides methods for working with registration providers (services managing registrations on OSF)
   */
  get registrationProviders(): RegistrationProviders {
    if (!this._registrationProviders) {
      this._registrationProviders = new RegistrationProviders(this.httpClient);
    }
    return this._registrationProviders;
  }

  /**
   * Access the Collection Providers resource
   *
   * Provides methods for working with collection providers (services curating collections on OSF)
   */
  get collectionProviders(): CollectionProviders {
    if (!this._collectionProviders) {
      this._collectionProviders = new CollectionProviders(this.httpClient);
    }
    return this._collectionProviders;
  }
}
