import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function RootPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('accessToken')

  if (token) {
    redirect('/today')
  } else {
    redirect('/login')
  }
}
