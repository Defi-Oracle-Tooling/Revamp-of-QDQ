/**
 * Network Governance and Dynamic Configuration
 * 
 * Provides governance mechanisms for blockchain networks including
 * voting systems, configuration updates, and permission management.
 * 
 * @category Advanced Operations
 */

export interface GovernanceConfig {
  /** Governance mode */
  mode: 'manual' | 'voting' | 'automated';
  /** Minimum votes required for proposals */
  quorum: number;
  /** Voting period in seconds */
  votingPeriod: number;
  /** Authorized governance participants */
  participants: string[];
  /** Proposal execution delay */
  executionDelay: number;
}

export interface NetworkProposal {
  /** Proposal ID */
  id: string;
  /** Proposal title */
  title: string;
  /** Detailed description */
  description: string;
  /** Proposer address */
  proposer: string;
  /** Proposal type */
  type: 'configuration' | 'validator-add' | 'validator-remove' | 'permission-update' | 'upgrade';
  /** Configuration changes */
  changes: ConfigurationChange[];
  /** Current vote counts */
  votes: {
    for: number;
    against: number;
    abstain: number;
  };
  /** Voting participants */
  voters: Map<string, 'for' | 'against' | 'abstain'>;
  /** Proposal status */
  status: 'pending' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
  /** Creation timestamp */
  createdAt: Date;
  /** Voting deadline */
  votingDeadline: Date;
  /** Execution timestamp */
  executionTime?: Date;
}

export interface ConfigurationChange {
  /** Configuration path */
  path: string;
  /** Current value */
  currentValue: any;
  /** Proposed new value */
  newValue: any;
  /** Change description */
  description: string;
}

export interface GovernanceEvent {
  /** Event ID */
  id: string;
  /** Event type */
  type: 'proposal-created' | 'vote-cast' | 'proposal-executed' | 'configuration-updated';
  /** Event timestamp */
  timestamp: Date;
  /** Participant address */
  participant: string;
  /** Related proposal ID */
  proposalId?: string;
  /** Additional event data */
  data: Record<string, any>;
}

/**
 * Network governance and configuration management system
 */
export class GovernanceManager {
  private config: GovernanceConfig;
  private proposals: Map<string, NetworkProposal> = new Map();
  private events: GovernanceEvent[] = [];
  private currentConfig: Map<string, any> = new Map();

  constructor(config: GovernanceConfig) {
    this.config = config;
    this.initializeDefaultConfig();
  }

  /**
   * Creates a new governance proposal
   */
  createProposal(
    proposer: string,
    title: string,
    description: string,
    type: NetworkProposal['type'],
    changes: ConfigurationChange[]
  ): NetworkProposal {
    if (!this.config.participants.includes(proposer)) {
      throw new Error('Proposer not authorized for governance');
    }

    const proposalId = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const proposal: NetworkProposal = {
      id: proposalId,
      title,
      description,
      proposer,
      type,
      changes,
      votes: { for: 0, against: 0, abstain: 0 },
      voters: new Map(),
      status: this.config.mode === 'manual' ? 'pending' : 'active',
      createdAt: new Date(),
      votingDeadline: new Date(Date.now() + this.config.votingPeriod * 1000)
    };

    this.proposals.set(proposalId, proposal);
    
    this.recordEvent({
      id: `event-${Date.now()}`,
      type: 'proposal-created',
      timestamp: new Date(),
      participant: proposer,
      proposalId,
      data: { title, type }
    });

    console.log(`📝 Proposal created: ${title} (${proposalId})`);
    
    return proposal;
  }

  /**
   * Casts a vote on a proposal
   */
  vote(proposalId: string, voter: string, vote: 'for' | 'against' | 'abstain'): void {
    if (!this.config.participants.includes(voter)) {
      throw new Error('Voter not authorized for governance');
    }

    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (proposal.status !== 'active') {
      throw new Error(`Cannot vote on proposal in ${proposal.status} state`);
    }

    if (new Date() > proposal.votingDeadline) {
      proposal.status = 'failed';
      throw new Error('Voting period has ended');
    }

    // Remove previous vote if exists
    const previousVote = proposal.voters.get(voter);
    if (previousVote) {
      proposal.votes[previousVote]--;
    }

    // Record new vote
    proposal.voters.set(voter, vote);
    proposal.votes[vote]++;

    this.recordEvent({
      id: `event-${Date.now()}`,
      type: 'vote-cast',
      timestamp: new Date(),
      participant: voter,
      proposalId,
      data: { vote, previousVote }
    });

    console.log(`🗳️  Vote cast by ${voter}: ${vote} on ${proposalId}`);

    // Check if proposal has enough votes
    this.checkProposalStatus(proposal);
  }

  /**
   * Executes a passed proposal
   */
  async executeProposal(proposalId: string, executor: string): Promise<void> {
    if (!this.config.participants.includes(executor)) {
      throw new Error('Executor not authorized for governance');
    }

    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (proposal.status !== 'passed') {
      throw new Error(`Cannot execute proposal in ${proposal.status} state`);
    }

    // Check execution delay
    const executionTime = new Date(proposal.votingDeadline.getTime() + this.config.executionDelay * 1000);
    if (new Date() < executionTime) {
      throw new Error(`Proposal can be executed after ${executionTime.toISOString()}`);
    }

    try {
      // Apply configuration changes
      for (const change of proposal.changes) {
        await this.applyConfigurationChange(change);
      }

      proposal.status = 'executed';
      proposal.executionTime = new Date();

      this.recordEvent({
        id: `event-${Date.now()}`,
        type: 'proposal-executed',
        timestamp: new Date(),
        participant: executor,
        proposalId,
        data: { changesApplied: proposal.changes.length }
      });

      console.log(`✅ Proposal executed: ${proposal.title}`);
    } catch (error) {
      console.error(`❌ Failed to execute proposal ${proposalId}:`, error);
      throw error;
    }
  }

  /**
   * Gets all proposals with optional filtering
   */
  getProposals(filters?: {
    status?: NetworkProposal['status'];
    type?: NetworkProposal['type'];
    proposer?: string;
  }): NetworkProposal[] {
    let proposals = Array.from(this.proposals.values());

    if (filters) {
      if (filters.status) {
        proposals = proposals.filter(p => p.status === filters.status);
      }
      if (filters.type) {
        proposals = proposals.filter(p => p.type === filters.type);
      }
      if (filters.proposer) {
        proposals = proposals.filter(p => p.proposer === filters.proposer);
      }
    }

    return proposals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Gets proposal details
   */
  getProposal(proposalId: string): NetworkProposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Gets governance events with optional filtering
   */
  getEvents(filters?: {
    type?: GovernanceEvent['type'];
    participant?: string;
    proposalId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): GovernanceEvent[] {
    let events = [...this.events];

    if (filters) {
      if (filters.type) {
        events = events.filter(e => e.type === filters.type);
      }
      if (filters.participant) {
        events = events.filter(e => e.participant === filters.participant);
      }
      if (filters.proposalId) {
        events = events.filter(e => e.proposalId === filters.proposalId);
      }
      if (filters.fromDate) {
        events = events.filter(e => e.timestamp >= filters.fromDate!);
      }
      if (filters.toDate) {
        events = events.filter(e => e.timestamp <= filters.toDate!);
      }
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Gets current network configuration
   */
  getCurrentConfiguration(): Record<string, any> {
    const config: Record<string, any> = {};
    for (const [key, value] of this.currentConfig) {
      config[key] = value;
    }
    return config;
  }

  /**
   * Updates configuration directly (for automated governance)
   */
  async updateConfiguration(path: string, value: any, updater: string): Promise<void> {
    if (this.config.mode !== 'automated' && !this.config.participants.includes(updater)) {
      throw new Error('Direct configuration updates not allowed in current governance mode');
    }

    const oldValue = this.currentConfig.get(path);
    this.currentConfig.set(path, value);

    this.recordEvent({
      id: `event-${Date.now()}`,
      type: 'configuration-updated',
      timestamp: new Date(),
      participant: updater,
      data: { path, oldValue, newValue: value }
    });

    console.log(`⚙️  Configuration updated: ${path} = ${JSON.stringify(value)}`);
  }

  /**
   * Checks and updates proposal status based on votes
   */
  private checkProposalStatus(proposal: NetworkProposal): void {
    const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
    const totalParticipants = this.config.participants.length;

    // Check if quorum is met and majority supports
    if (totalVotes >= this.config.quorum) {
      if (proposal.votes.for > proposal.votes.against) {
        proposal.status = 'passed';
        console.log(`✅ Proposal passed: ${proposal.title}`);
      } else {
        proposal.status = 'failed';
        console.log(`❌ Proposal failed: ${proposal.title}`);
      }
    }
    // Check if all participants have voted
    else if (totalVotes === totalParticipants) {
      if (proposal.votes.for > proposal.votes.against) {
        proposal.status = 'passed';
      } else {
        proposal.status = 'failed';
      }
    }
  }

  /**
   * Applies a configuration change to the network
   */
  private async applyConfigurationChange(change: ConfigurationChange): Promise<void> {
    console.log(`Applying configuration change: ${change.path}`);
    
    // Validate the change
    if (!this.validateConfigurationChange(change)) {
      throw new Error(`Invalid configuration change: ${change.description}`);
    }

    // Apply the change
    this.currentConfig.set(change.path, change.newValue);

    // In real implementation, would propagate to network nodes
    await this.propagateConfigurationChange(change);
  }

  /**
   * Validates a configuration change
   */
  private validateConfigurationChange(change: ConfigurationChange): boolean {
    // Implement validation logic based on configuration path and value
    console.log(`Validating change: ${change.path} -> ${JSON.stringify(change.newValue)}`);
    return true; // Placeholder
  }

  /**
   * Propagates configuration change to network nodes
   */
  private async propagateConfigurationChange(change: ConfigurationChange): Promise<void> {
    console.log(`Propagating configuration change to network nodes: ${change.path}`);
    // In real implementation, would send updates to all nodes
  }

  /**
   * Records a governance event
   */
  private recordEvent(event: GovernanceEvent): void {
    this.events.push(event);
    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /**
   * Initializes default network configuration
   */
  private initializeDefaultConfig(): void {
    const defaultConfig = {
      'network.blockTime': 15,
      'network.gasLimit': 8000000,
      'consensus.validators.min': 4,
      'consensus.validators.max': 21,
      'rpc.cors.enabled': true,
      'rpc.cors.origins': ['*'],
      'mining.enabled': true,
      'txpool.maxSize': 4096
    };

    for (const [key, value] of Object.entries(defaultConfig)) {
      this.currentConfig.set(key, value);
    }
  }
}