import User from "../models/user.models.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const createSuperAdmin = async () => {
    try {
        const superAdmin = await User.findOne({ 
            email: process.env.SUPER_ADMIN_EMAIL,
            username: "superadmin" 
        });

        if (superAdmin) {
            console.log("Super admin already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            process.env.SUPER_ADMIN_PASSWORD, 
            10
        );

        const newSuperAdmin = await User.create({
            id: `user-${Date.now()}`,
            fullName: "Super Admin",
            email: process.env.SUPER_ADMIN_EMAIL,
            username: "superadmin",
            password: hashedPassword,
            isAdmin: true,
            adminRole: "super",
            avatar: "https://example.com/default-avatar.png", // Add a default avatar URL
            coverImage: "https://example.com/default-cover.png" // Add a default cover image URL
        });

        console.log("Super admin created successfully:", newSuperAdmin.id);
    } catch (error) {
        console.error("Failed to create super admin:", error);
    }
    process.exit(0);
};

// Execute the function
createSuperAdmin(); 