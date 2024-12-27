# NextChat - Multi-Application Support System

This is a [Next.js](https://nextjs.org) project that implements a powerful multi-application support system with superadmin capabilities.

## Features

- **Multi-Application Support**: Manage multiple applications from a central dashboard
- **Role-Based Access Control**: Superadmin and app-specific admin roles
- **User Management**: Suspend/unsuspend users across applications
- **Message Management**: Application-specific messaging with role-based visibility
- **Customizable Settings**: Per-application configuration options

## System Architecture

### Database Models

1. **Application Model** (`models/application.model.ts`)
```typescript
{
  name: string;           // Unique application identifier
  settings: object;       // Flexible settings object
  isActive: boolean;      // Application status
  createdAt: Date;       // Creation timestamp
  updatedAt: Date;       // Last update timestamp
}
```

2. **AppAdmin Model** (`models/appAdmin.model.ts`)
```typescript
{
  userId: string;         // Format: "appname+phonenumber"
  applicationId: ObjectId;// Reference to Application
  role: "admin" | "superadmin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

3. **SuspendedUser Model** (`models/suspendedUser.model.ts`)
```typescript
{
  userId: string;         // Format: "appname+phonenumber"
  applicationId: ObjectId;
  reason?: string;
  suspendedBy: string;
  suspendedAt: Date;
  suspendedUntil?: Date;
}
```

4. **SupportMessage Model** (`models/supportMessage.model.ts`)
```typescript
{
  sender: string;         // Format: "appname+phonenumber"
  receiver: string;       // Format: "appname+phonenumber"
  applicationId: ObjectId;
  senderRole: 'user' | 'admin' | 'superadmin';
  receiverRole: 'user' | 'admin' | 'superadmin';
  content: string;
  messageType: "text" | "file" | "voice";
  // ... other message properties
}
```

### API Routes

1. **Applications API** (`/api/v1/superadmin/applications`)
   - `POST`: Create new application
   - `GET`: List all applications
   - `PUT`: Update application settings/status

2. **Admins API** (`/api/v1/superadmin/admins`)
   - `POST`: Add new admin
   - `GET`: List admins (with optional application filter)
   - `DELETE`: Remove admin

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

3. Run the development server:
```bash
npm run dev
```

4. Access the superadmin dashboard at `/superadmin`

## Superadmin Features

1. **Application Management**
   - Create new applications
   - Configure application settings
   - Toggle application status
   - View admin statistics

2. **Admin Management**
   - Add/remove admins for each application
   - View admin activity
   - Manage admin permissions

3. **Settings Management**
   - Welcome message configuration
   - Support email settings
   - Message length limits
   - Custom theme colors
   - Application logo/icon upload

## Security Considerations

1. **Authentication**
   - JWT-based authentication
   - Role-based access control
   - Secure token storage

2. **Data Isolation**
   - Application-specific data segregation
   - Admin access restrictions
   - Message visibility controls

3. **User Protection**
   - User suspension system
   - Activity monitoring
   - Rate limiting

## UI Components

The system uses a modern UI built with:
- Tailwind CSS for styling
- Shadcn/ui components
- Responsive design
- Dark/light mode support

## Best Practices

1. **Code Organization**
   - Modular component structure
   - Type-safe interfaces
   - Clean architecture patterns

2. **Performance**
   - Efficient database queries
   - Indexed collections
   - Optimized API routes

3. **Scalability**
   - Horizontally scalable design
   - Efficient data modeling
   - Caching strategies

## Development Guidelines

1. **Adding New Features**
   - Follow existing patterns
   - Maintain type safety
   - Add appropriate tests
   - Update documentation

2. **API Development**
   - Use proper error handling
   - Implement request validation
   - Follow RESTful principles
   - Add rate limiting

3. **UI Development**
   - Follow design system
   - Ensure accessibility
   - Maintain responsive design
   - Test cross-browser compatibility

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
