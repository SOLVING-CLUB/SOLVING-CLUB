import { getSupabaseClient } from '@/lib/supabase';
import type { CustomProperty } from '@/lib/types/project-tasks';

const supabase = getSupabaseClient();

/**
 * Get custom properties for a project
 */
export async function getCustomProperties(projectId: string): Promise<CustomProperty[]> {
  const { data, error } = await supabase
    .from('project_task_custom_properties')
    .select('*')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching custom properties', error);
    throw error;
  }

  return (data || []) as CustomProperty[];
}

/**
 * Create a custom property
 */
export async function createCustomProperty(
  projectId: string,
  property: Omit<CustomProperty, 'id' | 'project_id' | 'created_at'>
): Promise<CustomProperty> {
  const { data, error } = await supabase
    .from('project_task_custom_properties')
    .insert({
      project_id: projectId,
      ...property,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating custom property', error);
    throw error;
  }

  return data as CustomProperty;
}

/**
 * Update a custom property
 */
export async function updateCustomProperty(
  propertyId: string,
  updates: Partial<CustomProperty>
): Promise<CustomProperty> {
  const { data, error } = await supabase
    .from('project_task_custom_properties')
    .update(updates)
    .eq('id', propertyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating custom property', error);
    throw error;
  }

  return data as CustomProperty;
}

/**
 * Delete a custom property
 */
export async function deleteCustomProperty(propertyId: string): Promise<void> {
  const { error } = await supabase
    .from('project_task_custom_properties')
    .delete()
    .eq('id', propertyId);

  if (error) {
    console.error('Error deleting custom property', error);
    throw error;
  }
}

/**
 * Set custom property value for a task
 */
export async function setCustomPropertyValue(
  taskId: string,
  propertyId: string,
  value: any,
  propertyType: string
): Promise<void> {
  const valueData: any = {
    task_id: taskId,
    property_id: propertyId,
  };

  switch (propertyType) {
    case 'text':
    case 'url':
      valueData.value_text = value;
      break;
    case 'number':
      valueData.value_number = value;
      break;
    case 'date':
      valueData.value_date = value;
      break;
    case 'boolean':
      valueData.value_boolean = value;
      break;
    case 'tags':
    case 'dropdown':
      valueData.value_array = Array.isArray(value) ? value : [value];
      break;
    default:
      valueData.value_text = value;
  }

  const { error } = await supabase
    .from('project_task_custom_values')
    .upsert(valueData, {
      onConflict: 'task_id,property_id',
    });

  if (error) {
    console.error('Error setting custom property value', error);
    throw error;
  }
}

/**
 * Delete custom property value for a task
 */
export async function deleteCustomPropertyValue(taskId: string, propertyId: string): Promise<void> {
  const { error } = await supabase
    .from('project_task_custom_values')
    .delete()
    .eq('task_id', taskId)
    .eq('property_id', propertyId);

  if (error) {
    console.error('Error deleting custom property value', error);
    throw error;
  }
}

