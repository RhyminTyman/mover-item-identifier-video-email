/**
 * CRM Connector Service
 * Handles integration with various moving company CRM systems
 */

export interface CrmConfig {
  apiEndpoint?: string;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  settings?: Record<string, unknown>;
}

export interface CrmLead {
  crmLeadId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  priority: string;
  estimatedValue?: number;
  notes?: string;
  moveDate?: Date;
  originAddress?: string;
  destinationAddress?: string;
  moveType?: string;
}

export interface CrmSale {
  crmSaleId: string;
  opportunityName: string;
  stage: string;
  probability?: number;
  estimatedValue?: number;
  actualValue?: number;
  expectedCloseDate?: Date;
  notes?: string;
  leadId?: string;
}

export interface CrmSchedule {
  crmScheduleId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  type: string;
  status: string;
  priority: string;
  attendees?: Array<{
    name: string;
    email: string;
    role: string;
  }>;
  leadId?: string;
}

export interface CrmSyncResult {
  leads: { synced: number; created: number; updated: number };
  sales: { synced: number; created: number; updated: number };
  schedules: { synced: number; created: number; updated: number };
}

export abstract class CrmConnector {
  protected config: CrmConfig;

  constructor(config: CrmConfig) {
    this.config = config;
  }

  abstract testConnection(): Promise<boolean>;
  abstract syncLeads(): Promise<CrmLead[]>;
  abstract syncSales(): Promise<CrmSale[]>;
  abstract syncSchedules(): Promise<CrmSchedule[]>;
  abstract createLead(lead: Partial<CrmLead>): Promise<CrmLead>;
  abstract updateLead(leadId: string, updates: Partial<CrmLead>): Promise<CrmLead>;
  abstract createSale(sale: Partial<CrmSale>): Promise<CrmSale>;
  abstract updateSale(saleId: string, updates: Partial<CrmSale>): Promise<CrmSale>;
}

/**
 * SmartMoving CRM Connector
 * https://www.smartmoving.com/blog/6-ways-to-use-smartmoving-api
 */
export class SmartMovingConnector extends CrmConnector {
  private baseUrl = 'https://api.smartmoving.com/v1';

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/test`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async syncLeads(): Promise<CrmLead[]> {
    try {
      const response = await fetch(`${this.baseUrl}/leads`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SmartMoving API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.leads.map((lead: Record<string, unknown>) => ({
        crmLeadId: String(lead.id || ''),
        firstName: String(lead.first_name || ''),
        lastName: String(lead.last_name || ''),
        email: lead.email ? String(lead.email) : undefined,
        phone: lead.phone ? String(lead.phone) : undefined,
        company: lead.company ? String(lead.company) : undefined,
        source: lead.source ? String(lead.source) : undefined,
        status: String(lead.status || 'new'),
        priority: String(lead.priority || 'medium'),
        estimatedValue: typeof lead.estimated_value === 'number' ? lead.estimated_value : undefined,
        notes: lead.notes ? String(lead.notes) : undefined,
        moveDate: lead.move_date ? new Date(String(lead.move_date)) : undefined,
        originAddress: lead.origin_address ? String(lead.origin_address) : undefined,
        destinationAddress: lead.destination_address ? String(lead.destination_address) : undefined,
        moveType: lead.move_type ? String(lead.move_type) : undefined
      }));
    } catch (error) {
      console.error('SmartMoving sync leads error:', error);
      throw error;
    }
  }

  async syncSales(): Promise<CrmSale[]> {
    try {
      const response = await fetch(`${this.baseUrl}/opportunities`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SmartMoving API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.opportunities.map((sale: Record<string, unknown>) => ({
        crmSaleId: String(sale.id || ''),
        opportunityName: String(sale.name || ''),
        stage: String(sale.stage || ''),
        probability: typeof sale.probability === 'number' ? sale.probability : undefined,
        estimatedValue: typeof sale.estimated_value === 'number' ? sale.estimated_value : undefined,
        actualValue: typeof sale.actual_value === 'number' ? sale.actual_value : undefined,
        expectedCloseDate: sale.expected_close_date ? new Date(String(sale.expected_close_date)) : undefined,
        notes: sale.notes ? String(sale.notes) : undefined,
        leadId: sale.lead_id ? String(sale.lead_id) : undefined
      }));
    } catch (error) {
      console.error('SmartMoving sync sales error:', error);
      throw error;
    }
  }

  async syncSchedules(): Promise<CrmSchedule[]> {
    try {
      const response = await fetch(`${this.baseUrl}/appointments`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SmartMoving API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.appointments.map((appointment: Record<string, unknown>) => ({
        crmScheduleId: String(appointment.id || ''),
        title: String(appointment.title || ''),
        description: appointment.description ? String(appointment.description) : undefined,
        startTime: new Date(String(appointment.start_time)),
        endTime: appointment.end_time ? new Date(String(appointment.end_time)) : undefined,
        location: appointment.location ? String(appointment.location) : undefined,
        type: String(appointment.type || ''),
        status: String(appointment.status || ''),
        priority: String(appointment.priority || 'medium'),
        attendees: Array.isArray(appointment.attendees) ? appointment.attendees.map((attendee: Record<string, unknown>) => ({
          name: String(attendee.name || ''),
          email: String(attendee.email || ''),
          role: String(attendee.role || '')
        })) : undefined,
        leadId: appointment.lead_id ? String(appointment.lead_id) : undefined
      }));
    } catch (error) {
      console.error('SmartMoving sync schedules error:', error);
      throw error;
    }
  }

  async createLead(lead: Partial<CrmLead>): Promise<CrmLead> {
    try {
      const response = await fetch(`${this.baseUrl}/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: lead.firstName,
          last_name: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          source: lead.source,
          status: lead.status,
          priority: lead.priority,
          estimated_value: lead.estimatedValue,
          notes: lead.notes,
          move_date: lead.moveDate?.toISOString(),
          origin_address: lead.originAddress,
          destination_address: lead.destinationAddress,
          move_type: lead.moveType
        })
      });

      if (!response.ok) {
        throw new Error(`SmartMoving API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        crmLeadId: data.id.toString(),
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        source: data.source,
        status: data.status,
        priority: data.priority,
        estimatedValue: data.estimated_value,
        notes: data.notes,
        moveDate: data.move_date ? new Date(data.move_date) : undefined,
        originAddress: data.origin_address,
        destinationAddress: data.destination_address,
        moveType: data.move_type
      };
    } catch (error) {
      console.error('SmartMoving create lead error:', error);
      throw error;
    }
  }

  async updateLead(leadId: string, updates: Partial<CrmLead>): Promise<CrmLead> {
    try {
      const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: updates.firstName,
          last_name: updates.lastName,
          email: updates.email,
          phone: updates.phone,
          company: updates.company,
          source: updates.source,
          status: updates.status,
          priority: updates.priority,
          estimated_value: updates.estimatedValue,
          notes: updates.notes,
          move_date: updates.moveDate?.toISOString(),
          origin_address: updates.originAddress,
          destination_address: updates.destinationAddress,
          move_type: updates.moveType
        })
      });

      if (!response.ok) {
        throw new Error(`SmartMoving API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        crmLeadId: data.id.toString(),
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        source: data.source,
        status: data.status,
        priority: data.priority,
        estimatedValue: data.estimated_value,
        notes: data.notes,
        moveDate: data.move_date ? new Date(data.move_date) : undefined,
        originAddress: data.origin_address,
        destinationAddress: data.destination_address,
        moveType: data.move_type
      };
    } catch (error) {
      console.error('SmartMoving update lead error:', error);
      throw error;
    }
  }

  async createSale(sale: Partial<CrmSale>): Promise<CrmSale> {
    try {
      const response = await fetch(`${this.baseUrl}/opportunities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: sale.opportunityName,
          stage: sale.stage,
          probability: sale.probability,
          estimated_value: sale.estimatedValue,
          actual_value: sale.actualValue,
          expected_close_date: sale.expectedCloseDate?.toISOString(),
          notes: sale.notes,
          lead_id: sale.leadId
        })
      });

      if (!response.ok) {
        throw new Error(`SmartMoving API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        crmSaleId: data.id.toString(),
        opportunityName: data.name,
        stage: data.stage,
        probability: data.probability,
        estimatedValue: data.estimated_value,
        actualValue: data.actual_value,
        expectedCloseDate: data.expected_close_date ? new Date(data.expected_close_date) : undefined,
        notes: data.notes,
        leadId: data.lead_id?.toString()
      };
    } catch (error) {
      console.error('SmartMoving create sale error:', error);
      throw error;
    }
  }

  async updateSale(saleId: string, updates: Partial<CrmSale>): Promise<CrmSale> {
    try {
      const response = await fetch(`${this.baseUrl}/opportunities/${saleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: updates.opportunityName,
          stage: updates.stage,
          probability: updates.probability,
          estimated_value: updates.estimatedValue,
          actual_value: updates.actualValue,
          expected_close_date: updates.expectedCloseDate?.toISOString(),
          notes: updates.notes,
          lead_id: updates.leadId
        })
      });

      if (!response.ok) {
        throw new Error(`SmartMoving API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        crmSaleId: data.id.toString(),
        opportunityName: data.name,
        stage: data.stage,
        probability: data.probability,
        estimatedValue: data.estimated_value,
        actualValue: data.actual_value,
        expectedCloseDate: data.expected_close_date ? new Date(data.expected_close_date) : undefined,
        notes: data.notes,
        leadId: data.lead_id?.toString()
      };
    } catch (error) {
      console.error('SmartMoving update sale error:', error);
      throw error;
    }
  }
}

/**
 * MoveGuru CRM Connector
 * Custom implementation for MoveGuru API
 */
export class MoveGuruConnector extends CrmConnector {
  private baseUrl = 'https://api.moveguru.com/v2';

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ping`, {
        headers: {
          'X-API-Key': this.config.apiKey || '',
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async syncLeads(): Promise<CrmLead[]> {
    // Implementation for MoveGuru API
    // This would be similar to SmartMoving but with MoveGuru's specific API structure
    throw new Error('MoveGuru connector not implemented yet');
  }

  async syncSales(): Promise<CrmSale[]> {
    throw new Error('MoveGuru connector not implemented yet');
  }

  async syncSchedules(): Promise<CrmSchedule[]> {
    throw new Error('MoveGuru connector not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createLead(_lead: Partial<CrmLead>): Promise<CrmLead> {
    throw new Error('MoveGuru connector not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateLead(_leadId: string, _updates: Partial<CrmLead>): Promise<CrmLead> {
    throw new Error('MoveGuru connector not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createSale(_sale: Partial<CrmSale>): Promise<CrmSale> {
    throw new Error('MoveGuru connector not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateSale(_saleId: string, _updates: Partial<CrmSale>): Promise<CrmSale> {
    throw new Error('MoveGuru connector not implemented yet');
  }
}

/**
 * CRM Connector Factory
 * Creates the appropriate connector based on provider
 */
export function createCrmConnector(provider: string, config: CrmConfig): CrmConnector {
  switch (provider.toLowerCase()) {
    case 'smartmoving':
      return new SmartMovingConnector(config);
    case 'moveguru':
      return new MoveGuruConnector(config);
    case 'movingwaldo':
      // return new MovingWaldoConnector(config);
      throw new Error('MovingWaldo connector not implemented yet');
    case 'movecrm':
      // return new MoveCrmConnector(config);
      throw new Error('MoveCRM connector not implemented yet');
    case 'motiontools':
      // return new MotionToolsConnector(config);
      throw new Error('MotionTools connector not implemented yet');
    case 'custom':
      // return new CustomConnector(config);
      throw new Error('Custom connector not implemented yet');
    default:
      throw new Error(`Unsupported CRM provider: ${provider}`);
  }
}

/**
 * CRM Sync Service
 * Handles syncing data between our system and external CRMs
 */
export class CrmSyncService {
  private connector: CrmConnector;

  constructor(connector: CrmConnector) {
    this.connector = connector;
  }

  async syncAllData(): Promise<CrmSyncResult> {
    const results: CrmSyncResult = {
      leads: { synced: 0, created: 0, updated: 0 },
      sales: { synced: 0, created: 0, updated: 0 },
      schedules: { synced: 0, created: 0, updated: 0 }
    };

    try {
      // Test connection first
      const isConnected = await this.connector.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to CRM');
      }

      // Sync leads
      const leads = await this.connector.syncLeads();
      results.leads.synced = leads.length;
      // Note: created/updated counts would be determined by comparing with existing data

      // Sync sales
      const sales = await this.connector.syncSales();
      results.sales.synced = sales.length;

      // Sync schedules
      const schedules = await this.connector.syncSchedules();
      results.schedules.synced = schedules.length;

    } catch (error) {
      console.error('CRM sync error:', error);
      throw error;
    }

    return results;
  }
}
