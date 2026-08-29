// app/api/check-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie'; // Make sure 'cookie' is installed: npm install cookie
import bcrypt from 'bcryptjs';
import {env} from '@/env.js';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!process.env.PAGE_PASSWORD_HASH) {
    console.error('PAGE_PASSWORD_HASH environment variable is not set.');
    return new NextResponse(
      JSON.stringify({ message: 'Server configuration error.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    env.PAGE_PASSWORD_HASH
  );

  if (isPasswordCorrect) {
    const cookieName = process.env.PASSWORD_COOKIE_NAME || 'hasPageAccess';
    const cookie = serialize(cookieName, 'true', {
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      path: '/', // Accessible across the entire site
      maxAge: 60 * 60 * 3, // 1 day expiration (adjust as needed)
      sameSite: 'lax', // Protects against CSRF
    });

    return new NextResponse(JSON.stringify({ message: 'Access granted' }), {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json',
      },
    });
  } else {
    return new NextResponse(JSON.stringify({ message: 'Incorrect password' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
