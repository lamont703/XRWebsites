import { getContainer } from "../database.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const createSuperAdmin = async () => {
    try {
        const container = await getContainer();
        
        // Check if super admin exists
        const querySpec = {
            query: "SELECT * FROM c WHERE c.type = 'user' AND c.adminRole = 'super' AND c.email = @email",
            parameters: [
                {
                    name: "@email",
                    value: process.env.SUPER_ADMIN_EMAIL
                }
            ]
        };
        
        const { resources } = await container.items.query(querySpec).fetchAll();
        
        if (resources.length > 0) {
            console.log("Super admin already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            process.env.SUPER_ADMIN_PASSWORD, 
            10
        );

        const superAdmin = {
            id: `user-${Date.now()}`,
            type: 'user',
            fullName: "Super Admin",
            email: process.env.SUPER_ADMIN_EMAIL,
            username: "superadmin",
            password: hashedPassword,
            isAdmin: true,
            isSuperAdmin: true,
            adminRole: "super",
            created_at: new Date(),
            updated_at: new Date(),
            avatar: process.env.DEFAULT_AVATAR_URL || "https://example.com/default-avatar.png",
            coverImage: process.env.DEFAULT_COVER_URL || "https://example.com/default-cover.png"
        };

        const { resource } = await container.items.create(superAdmin);
        console.log("Super admin created successfully:", resource.id);
    } catch (error) {
        console.error("Failed to create super admin:", error);
    }
    process.exit(0);
};

// Execute the function
createSuperAdmin(); 