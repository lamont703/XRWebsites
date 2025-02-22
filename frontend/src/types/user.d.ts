interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
  type: 'user';
  isAdmin: boolean;
}

export default User; 