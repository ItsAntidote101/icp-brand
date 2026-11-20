import { redirect } from 'next/navigation'

// Monthly notes now live inside each client's page in the control room.
export default function AdminNotesRedirect() {
  redirect('/admin')
}
