// Google Drive API utility functions

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapi;
let googleAuth;
let isInitialized = false;

// Initialize Google Drive API
export const initializeGoogleDrive = async () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Drive API only works in browser'));
      return;
    }

    if (isInitialized && gapi && googleAuth) {
      resolve();
      return;
    }

    // Check if API keys are available
    if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      reject(new Error('Google API keys not configured. Please add NEXT_PUBLIC_GOOGLE_API_KEY and NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file'));
      return;
    }

    // Load Google API script with timeout
    const loadGoogleAPI = () => {
      return new Promise((resolveLoad, rejectLoad) => {
        if (window.gapi) {
          resolveLoad();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        
        const timeout = setTimeout(() => {
          rejectLoad(new Error('Google API script loading timed out'));
        }, 10000); // 10 second timeout
        
        script.onload = () => {
          clearTimeout(timeout);
          resolveLoad();
        };
        
        script.onerror = () => {
          clearTimeout(timeout);
          rejectLoad(new Error('Failed to load Google API script'));
        };
        
        document.head.appendChild(script);
      });
    };

    loadGoogleAPI()
      .then(() => {
        return new Promise((resolveGapi, rejectGapi) => {
          const gapiTimeout = setTimeout(() => {
            rejectGapi(new Error('GAPI load timed out'));
          }, 10000);

          window.gapi.load('client:auth2', () => {
            clearTimeout(gapiTimeout);
            resolveGapi();
          });
        });
      })
      .then(() => {
        gapi = window.gapi;
        
        // Initialize the client with better error handling
        let retryCount = 0;
        const maxRetries = 3;
        
        const initClient = async () => {
          try {
            const initConfig = {
              apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
              clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              discoveryDocs: [DISCOVERY_DOC],
              scope: SCOPES
            };

            console.log('Initializing Google API client...', { 
              hasApiKey: !!initConfig.apiKey,
              hasClientId: !!initConfig.clientId,
              discoveryDoc: DISCOVERY_DOC
            });
            
            await gapi.client.init(initConfig);
            
            // Verify auth2 is properly initialized
            if (!gapi.auth2) {
              throw new Error('Google Auth2 not initialized');
            }
            
            googleAuth = gapi.auth2.getAuthInstance();
            
            if (!googleAuth) {
              throw new Error('Failed to get Google Auth instance');
            }
            
            isInitialized = true;
            console.log('Google API client initialized successfully');
            resolve();
          } catch (error) {
            console.error('Google API initialization error:', error);
            
            if (retryCount < maxRetries) {
              retryCount++;
              console.warn(`Google API initialization failed, retrying... (${retryCount}/${maxRetries})`);
              setTimeout(initClient, 2000 * retryCount);
            } else {
              reject(new Error(`Google API initialization failed after ${maxRetries} attempts: ${error.message || 'Unknown error'}`));
            }
          }
        };
        
        return initClient();
      })
      .catch(error => {
        reject(new Error(`Failed to load Google API: ${error.message}`));
      });
  });
};

// Sign in to Google Drive
export const signInToGoogleDrive = async () => {
  try {
    if (!googleAuth || !isInitialized) {
      await initializeGoogleDrive();
    }
    
    if (!googleAuth.isSignedIn.get()) {
      await googleAuth.signIn();
    }
    
    return googleAuth.isSignedIn.get();
  } catch (error) {
    console.error('Error signing in to Google Drive:', error);
    throw new Error(`Google Drive sign-in failed: ${error.message}`);
  }
};

// Upload file to Google Drive
export const uploadFileToGoogleDrive = async (file, fileName) => {
  try {
    // Ensure user is signed in to Google Drive
    const isSignedIn = await signInToGoogleDrive();
    if (!isSignedIn) {
      throw new Error('Failed to sign in to Google Drive');
    }

    // Validate file
    if (!file || !file.size) {
      throw new Error('Invalid file provided');
    }

    // Create file metadata
    const metadata = {
      name: fileName || file.name,
      parents: [], // Put in root folder, you can specify a folder ID here
    };

    // Create form data for multipart upload
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    // Get access token
    const authInstance = gapi.auth2.getAuthInstance();
    const currentUser = authInstance.currentUser.get();
    const authResponse = currentUser.getAuthResponse();
    
    if (!authResponse || !authResponse.access_token) {
      throw new Error('No valid access token available');
    }

    // Upload file
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authResponse.access_token}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.id) {
      throw new Error('Upload succeeded but no file ID returned');
    }
    
    // Make file publicly readable
    try {
      await gapi.client.drive.permissions.create({
        fileId: result.id,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permissionError) {
      console.warn('Could not set file permissions, file may not be publicly accessible:', permissionError);
    }

    // Return the public URL
    return `https://drive.google.com/file/d/${result.id}/view`;
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Get shareable link for a file
export const getShareableLink = (fileId) => {
  return `https://drive.google.com/file/d/${fileId}/view`;
};

// Get direct download link (for images, videos, etc.)
export const getDirectLink = (fileId) => {
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
};

// Extract file ID from Google Drive URL
export const extractFileIdFromUrl = (url) => {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};
