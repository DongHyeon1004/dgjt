import { mountHeader } from './components/header.js';
import { mountFooter } from './components/footer.js';
import { userApi } from './api/user.js';
import { isLoggedIn, setProfile } from './auth/session.js';

export async function bootstrapLayout({ withHeader = true, withFooter = true } = {}) {
  const tasks = [];
  if (withHeader) tasks.push(mountHeader());
  if (withFooter) tasks.push(mountFooter());
  await Promise.all(tasks);

  if (isLoggedIn()) {
    refreshProfile();
  }
}

async function refreshProfile() {
  try {
    const data = await userApi.getMyProfile();
    setProfile({
      nickname: data.nickname ?? null,
      isAdmin: !!data.is_admin,
    });
  } catch (err) {
    console.error('Failed to fetch user profile', err);
  }
}

export function renderIcons() {
  if (window.lucide) window.lucide.createIcons();
}
