import { supabase } from '../supabaseClient.js';

// Create the case in three small steps so the private contact/location record
// is stored separately from the case summary shown in staff/provider workflows.
// The database RLS policies remain the authority for ownership and access.
export async function createManagedServiceCase(caseInput, privateDetails) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Please sign in with a client account to continue.');

  const { data: caseRecord, error: caseError } = await supabase
    .from('managed_service_cases')
    .insert({
      ...caseInput,
      client_id: user.id,
      status: 'draft',
    })
    .select('id')
    .single();

  if (caseError) throw caseError;

  const cleanupDraft = async () => {
    const { error } = await supabase
      .from('managed_service_cases')
      .delete()
      .eq('id', caseRecord.id)
      .eq('status', 'draft');

    if (error) {
      // Keep the original submission error for the user, but leave a trace if
      // the incomplete draft could not be removed.
      console.error('Unable to clean up an incomplete managed case draft:', error);
    }
  };

  const { error: detailsError } = await supabase
    .from('managed_case_private_details')
    .insert({ ...privateDetails, case_id: caseRecord.id });

  if (detailsError) {
    await cleanupDraft();
    throw detailsError;
  }

  // Only mark the case submitted after both records have been saved.
  const { data: submittedCase, error: submitError } = await supabase
    .from('managed_service_cases')
    .update({ status: 'submitted' })
    .eq('id', caseRecord.id)
    .eq('status', 'draft')
    .select('id')
    .single();

  if (submitError) {
    await cleanupDraft();
    throw submitError;
  }

  return submittedCase;
}
