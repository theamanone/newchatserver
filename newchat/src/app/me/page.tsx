"use client";
import { DEFAULT_DOCUMENT_IMAGE } from '@/lib/data';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

export default function Page() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const [error, setError] = useState(null); // Add error state

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/v1/user/me', {
                    headers: {
                        'Authorization': `Bearer JWT_TOKEN_HERE` // Add your token here
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const data = await response.json();
                setUser(data?.user);
            } catch (err:any) {
                console.error(err);
                setError(err.message); // Set error message
            } finally {
                setLoading(false); // Stop loading
            }
        };
        fetchUser();
    }, []);

    // Conditional rendering based on loading state and error
    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!user) {
        return <div>No user data available.</div>;
    }

    return (
        <div>
            <h1>User Profile</h1>
            <div>
                <Image src={user.avatar || DEFAULT_DOCUMENT_IMAGE} alt={`${user.username}'s avatar`} width={100} height={100} />
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Last Seen:</strong> {new Date(user.lastSeen).toLocaleString()}</p>
                <p><strong>Active:</strong> {user.isActive ? 'Yes' : 'No'}</p>
                <p><strong>Suspended:</strong> {user.isSuspended ? 'Yes' : 'No'}</p>
            </div>
        </div>
    );
}
