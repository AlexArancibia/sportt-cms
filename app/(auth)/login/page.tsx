'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LoginForm } from './components/login-form';

export default function LoginPage() {

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center p-4">
      <Link
        href="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-full px-4 py-2 text-gray-300 hover:bg-opacity-70 transition-all duration-300"
      >
        <span className="font-semibold">E-commerce</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <LoginForm />
      </motion.div>
    </div>
  );
}

