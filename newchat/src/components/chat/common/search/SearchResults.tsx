import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/useContext';
import Image from 'next/image';
import { IoPersonOutline, IoTimeOutline, IoChevronForward } from 'react-icons/io5';
import { searchConversations } from '@/utils/apihandler';

interface SearchResultsProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onClose?: () => void;
}

interface SearchResult {
    _id?: string;
    conversation_id?: string;
    type?: 'chat' | 'group';
    group_id?: string;
    groupName?: string;
    otherUser?: {
        user_id?: string;
        username?: string;
        avatar?: string;
    };
    lastMessage?: {
        content?: string;
        messageType?: string;
        timestamp?: string;
        sender?: {
            _id?: string;
            username?: string;
            avatar?: string;
        };
    };
    members?: Array<{
        user_id: string;
        username: string;
        avatar: string;
    }>;
}

const SearchResults: React.FC<SearchResultsProps> = ({
    searchQuery,
    setSearchQuery,
    onClose
}) => {
    const { isDarkMode, conversations } = useAppContext() || {};
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Search through local conversations and API
    useEffect(() => {
        const searchLocalConversations = () => {
            if (!conversations) return [];
            
            const query = searchQuery.toLowerCase().trim();
            console.log('Search query:', query);

            const filtered = conversations.filter(conv => {
                // Normalize the conversation object
                const normalizedConv = {
                    ...conv,
                    group_id: conv.type === 'group' ? (conv.group_id || conv._id) : undefined
                };

                if (normalizedConv.type === 'chat') {
                    const matchUsername = normalizedConv.otherUser?.username?.toLowerCase().includes(query);
                    const matchContent = normalizedConv.lastMessage?.content?.toLowerCase().includes(query);
                    return matchUsername || matchContent;
                } else if (normalizedConv.type === 'group') {
                    const matchGroupName = normalizedConv.groupName?.toLowerCase().includes(query);
                    const matchContent = normalizedConv.lastMessage?.content?.toLowerCase().includes(query);
                    const matchMembers = normalizedConv.members?.some(member => 
                        member.username.toLowerCase().includes(query)
                    );
                    return matchGroupName || matchContent || matchMembers;
                }
                return false;
            }).map(conv => ({
                ...conv,
                group_id: conv.type === 'group' ? (conv.group_id || conv._id) : undefined
            }));

            console.log('Filtered local results:', filtered);
            return filtered;
        };

        const fetchResults = async () => {
            if (searchQuery.trim().length > 2) {
                setIsLoading(true);
                try {
                    // First search local conversations
                    const localResults = searchLocalConversations();
                    
                    // Then fetch from API
                    const apiResults = await searchConversations(searchQuery);
                    const remoteResults = Array.isArray(apiResults) ? apiResults : 
                        apiResults?.data ? apiResults.data : 
                        apiResults?.conversations ? apiResults.conversations : [];
                    
                    // Normalize and combine results
                    const normalizedRemoteResults = remoteResults.map(result => ({
                        ...result,
                        group_id: result.type === 'group' ? (result.group_id || result._id) : undefined
                    }));

                    const combinedResults = [...localResults];
                    normalizedRemoteResults.forEach(remoteResult => {
                        const isDuplicate = combinedResults.some(localResult => 
                            (remoteResult.type === 'chat' && localResult.conversation_id === remoteResult.conversation_id) ||
                            (remoteResult.type === 'group' && localResult.group_id === remoteResult.group_id)
                        );
                        if (!isDuplicate) {
                            combinedResults.push(remoteResult);
                        }
                    });

                    console.log('Final combined results:', combinedResults);
                    setSearchResults(combinedResults);
                } catch (error) {
                    console.error('Search error:', error);
                    setSearchResults(searchLocalConversations());
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSearchResults([]);
            }
        };

        fetchResults();
    }, [searchQuery, conversations]);

    const containerVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        },
        exit: { 
            opacity: 0, 
            y: -20,
            transition: {
                when: "afterChildren",
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    const shimmerVariants = {
        hidden: { opacity: 0.3 },
        visible: { 
            opacity: 0.7,
            transition: {
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse" as const,
                ease: "easeInOut"
            }
        }
    } as const;

    const handleResultClick = (result: SearchResult) => {
        // Get the correct ID based on type
        const id = result.type === 'group' 
            ? (result.group_id || result._id)
            : result.conversation_id;
            
        if (id) {
            // Handle navigation
            setSearchQuery('');
            onClose?.();
        }
    };

    if (!searchQuery) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={isLoading ? 'loading' : 'results'}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-lg overflow-hidden ${
                    isDarkMode 
                        ? 'bg-dark-secondary-color border border-dark-border' 
                        : 'bg-white border border-gray-100'
                }`}
            >
                {isLoading ? (
                    <div className="space-y-3 p-2">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                className={`flex items-center p-3 rounded-lg ${
                                    isDarkMode ? 'bg-dark-quaternary-color' : 'bg-gray-100'
                                }`}
                                variants={shimmerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className={`w-10 h-10 rounded-full ${
                                    isDarkMode ? 'bg-dark-tertiary-color' : 'bg-gray-200'
                                }`} />
                                <div className="ml-3 space-y-2 flex-1">
                                    <div className={`h-4 rounded ${
                                        isDarkMode ? 'bg-dark-tertiary-color' : 'bg-gray-200'
                                    }`} />
                                    <div className={`h-3 rounded w-2/3 ${
                                        isDarkMode ? 'bg-dark-tertiary-color' : 'bg-gray-200'
                                    }`} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : searchResults.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 text-center ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    >
                        <IoPersonOutline className="mx-auto text-3xl mb-2" />
                        <p className="text-sm">No results found for "{searchQuery}"</p>
                    </motion.div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {Array.isArray(searchResults) && searchResults.map((result, index) => {
                            // Get the correct ID for the key
                            const resultId = result.type === 'group' 
                                ? (result.group_id || result._id)
                                : result.conversation_id;
                                
                            return (
                                <motion.div
                                    key={resultId || index}
                                    variants={itemVariants}
                                    whileHover={{ x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleResultClick(result)}
                                    className={`flex items-center p-3 cursor-pointer group ${
                                        isDarkMode 
                                            ? 'hover:bg-dark-hover' 
                                            : 'hover:bg-gray-50'
                                    } ${index !== 0 ? 'border-t border-gray-100/10' : ''}`}
                                >
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                        {result.type === 'group' ? (
                                            <div className={`w-full h-full flex items-center justify-center ${
                                                isDarkMode ? 'bg-dark-tertiary-color' : 'bg-gray-100'
                                            }`}>
                                                <IoPersonOutline className="text-xl" />
                                            </div>
                                        ) : result.otherUser?.avatar ? (
                                            <Image
                                                src={result.otherUser.avatar}
                                                alt={result.otherUser.username || 'User'}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center ${
                                                isDarkMode ? 'bg-dark-tertiary-color' : 'bg-gray-100'
                                            }`}>
                                                <IoPersonOutline className="text-xl" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="ml-3 flex-1 min-w-0">
                                        <h4 className={`font-medium truncate ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {result.type === 'group' 
                                                ? result.groupName
                                                : result.otherUser?.username || 'Unknown'}
                                        </h4>
                                        <p className={`text-sm truncate ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                            {result.type === 'group'
                                                ? `${result.members?.length || 0} members`
                                                : result.lastMessage?.content || 'No messages yet'}
                                        </p>
                                    </div>

                                    <div className={`flex items-center space-x-2 ml-2 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        {result.lastMessage?.timestamp && (
                                            <div className="flex items-center text-xs">
                                                <IoTimeOutline className="mr-1" />
                                                {result.lastMessage.timestamp}
                                            </div>
                                        )}
                                        <IoChevronForward className={`transform transition-transform ${
                                            isDarkMode ? 'group-hover:text-white' : 'group-hover:text-gray-900'
                                        } group-hover:translate-x-1`} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default SearchResults;
