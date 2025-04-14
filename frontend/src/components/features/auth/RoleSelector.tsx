import { motion } from 'framer-motion';
import { FaCode, FaBriefcase } from 'react-icons/fa';
import styles from '@/styles/RoleSelector.module.css';

interface RoleSelectorProps {
  selectedRole: string;
  onChange: (role: string) => void;
}

export const RoleSelector = ({ selectedRole, onChange }: RoleSelectorProps) => {
  const roles = [
    {
      id: 'developer',
      label: 'Developer',
      icon: <FaCode size={20} />,
      description: 'I want to build and develop on the platform'
    },
    {
      id: 'client',
      label: 'Client',
      icon: <FaBriefcase size={20} />,
      description: 'I want to use the platform services'
    }
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Choose your role</h3>
      <div className={styles.grid}>
        {roles.map((role) => (
          <motion.button
            key={role.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(role.id)}
            className={`${styles.roleButton} ${
              selectedRole === role.id 
                ? styles.roleButtonSelected 
                : styles.roleButtonUnselected
            }`}
          >
            <div className={styles.content}>
              <div className={styles.iconWrapper}>
                <div className={`${styles.iconContainer} ${
                  selectedRole === role.id
                    ? styles.iconContainerSelected
                    : styles.iconContainerUnselected
                }`}>
                  {role.icon}
                </div>
              </div>
              <div className={styles.textContent}>
                <h4 className={`${styles.label} ${
                  selectedRole === role.id
                    ? styles.labelSelected
                    : styles.labelUnselected
                }`}>
                  {role.label}
                </h4>
                <p className={styles.description}>{role.description}</p>
              </div>
              {selectedRole === role.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={styles.checkmark}
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}; 