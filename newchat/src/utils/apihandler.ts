import axios from 'axios'
import axiosInstance from './axiosInstance'
import { decrypt } from './encryption'
import { getRandomComplexSuffix } from '@/lib/suffixapi'

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_BASE_URL = '/api/v1'

// const getToken = () => {
//   const token = localStorage?.getItem('accessToken')
//   if (!token) {
//     throw new Error('Token not found')
//   }
//   return token
// }

const generateRandomAPIEndpoint = () => {
  const randomString = getRandomComplexSuffix(11) // Random string part (e.g., "Mbk85")
  const randomUppercaseString = getRandomComplexSuffix(5).toUpperCase() // Random uppercase (e.g., "EM")
  const randomNumber = Math.floor(Math.random() * 100) // Random number (0-99)

  // Construct the API endpoint path with combined dynamic parts (e.g., "Mbk85EM33")
  return `/api/v1/${randomString}${randomUppercaseString}${randomNumber}`
}
export const health = async (deviceHealthData: any) => {
  try {
    const randomEndpoint = generateRandomAPIEndpoint()
    const response = await axiosInstance.post(randomEndpoint, {
      deviceHealthData
    })
    return response.data
  } catch (error: any) {
    console.error('Error fetching health:', error.message)

    // Enhanced error handling
    if (error.response) {
      if (
        error.response.status === 401 &&
        error.response.data.action === 'logout'
      ) {
        // Trigger logout action for invalid session
        return { success: false, action: 'logout' }
      }
    }

    throw error // Re-throw if not handled
  }
}

export const refresh_token = async () => {
  // console.log("Attempting to refresh token...");
  try {
    const refresh = localStorage?.getItem('refreshToken')
    const response: any = await axiosInstance.post(
      `${API_BASE_URL}/user/refresh-token`,
      {},
      {
        headers: {
          refreshToken: `Bearer ${refresh}`
        }
      }
    )
    localStorage.setItem('refreshToken', response?.data.refreshToken)
    const decryptedData: any = decrypt(
      response?.data?.d,
      process.env.NEXT_PUBLIC_AES_KEY!
    )
    if (decryptedData) {
      sessionStorage.setItem('account', JSON.stringify(decryptedData))
    }
    return response?.data
  } catch (error: any) {
    console.error('refresh error:', error)
    // Handle specific error responses if necessary
    if (error.response) {
      console.error('API Response error:', error.response.data)
      // You can throw an error with more details if needed
    } else if (error.request) {
      console.error('No response received:', error.request)
    } else {
      console.error('Error setting up request:', error.message)
    }
    // Optionally, you can rethrow the error for further handling
    throw error // Optional: rethrow to handle it in the calling function
  }
}

export const searchConversations = async (query: string) => {
  try {
    const response = await axiosInstance.get(`/api/v1/conversation/search/${query}`);
    return response.data;
  } catch (error: any) {
    console.error('Error searching conversations:', error.message);
    throw error;
  }
}

export const logoutUser = async () => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/user/logout`,
      {},
      {
        headers: {
          // accessToken: `Bearer ${getToken()}`
        }
      }
    )
    localStorage.clear()
    sessionStorage.clear()
    return response.data
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

export const getMetaData = async (url: string) => {
  return await axiosInstance.post(
    `${API_BASE_URL}/conversation/chat/message/fetchUrlMetadata?url=${url}`
  )
}

export const getConversations = async (page: number) => {
  const response = await axiosInstance.get(
    `${API_BASE_URL}/conversation?page=${page}`,
    {
      headers: {
        // accessToken: `Bearer ${getToken()}`
      }
    }
  )
  return response?.data
}

export const getSingleConversation = async (conversationId: string, conversationType: string | null, userId?: string) => {
  try {
    const url = userId 
      ? `/api/v1/conversation/${conversationId}?type=${conversationType}&userId=${userId}`
      : `/api/v1/conversation/${conversationId}?type=${conversationType}`;
      
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error: any) {
    console.error('Error getting conversation:', error.message);
    throw error;
  }
}

export const getContacts = async () => {
  return await axiosInstance.get(`${API_BASE_URL}/conversation/chat/message/`)
}

export const getLoggedInUser = async () => {
  return await axiosInstance.get(`${API_BASE_URL}/user/me`)
}

//  ***************************   MESSAGES   ********************************  //

// get messages
export const fetchMessages = async (
  receiverId: string,
  page: number,
  conversationType: string
) => {
  const response = await axiosInstance.get(
    `${API_BASE_URL}/conversation/chat/message?target_id=${receiverId}&page=${page}&limit=20&type=${conversationType}`,
    {
      headers: {
        // accessToken: `Bearer ${getToken()}`
      }
    }
  )
  return response?.data
}

export const deleteMessage = async (
  messageId: string,
  deleteForEveryone: boolean
) => {
  try {
    await axiosInstance.delete(
      `${API_BASE_URL}/conversation/chat/delete/${messageId}`,
      {
        params: {
          deleteForEveryone: deleteForEveryone
        }
      }
    )
    return true // Return true if deletion was successful
  } catch (error: any) {
    console.error('Error deleting message:', error.message)
    return false // Return false if an error occurred
  }
}

//  ***************************   Conversation   ********************************  //

export const deleteConversation = async (otherUserId: string) => {
  try {
    await axiosInstance.delete(`${API_BASE_URL}/conversation/delete`, {
      params: {
        otherUserId: otherUserId
      }
    })
    return true // Return true if deletion was successful
  } catch (error: any) {
    console.error('Error deleting conversation:', error.message)
    return false // Return false if an error occurred
  }
}

//  ***************************   Group   ********************************  //

// create new group

export const createGroup = async (name: string, memberIds: string[]) => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/conversation/group/create`,
      {
        name,
        memberIds
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Error creating group:', error.message)
    throw error
  }
}

// Create new conversation
export const createNewConversation = async (userId: string) => {
  try {
    const response = await axiosInstance.post('/api/v1/conversation', {
      userId
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating conversation:', error.message);
    throw error;
  }
}

////////////////////////////// senstive  ////////////////////////////
export const deleteAccount = async () => {
  try {
    const response = await axiosInstance.delete(
      `${API_BASE_URL}/auth/user/deleteaccount`
    ) // Your API endpoint for deleting the user account
    return response?.data
  } catch (error) {
    console.error('Error deleting account:', error)
    throw error
  }
}