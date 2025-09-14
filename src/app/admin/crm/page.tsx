import { Metadata } from 'next';
import CrmManagement from '@/components/admin/CrmManagement';

export const metadata: Metadata = {
  title: 'CRM Management | Smart Move Inventory',
  description: 'Manage your CRM integrations and track leads, sales, and schedules',
};

export default function CrmManagementPage() {
  return <CrmManagement />;
}
