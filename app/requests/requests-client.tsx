'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Plus, Menu } from 'lucide-react';

export default function RequestsClient() {
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch requests and categories in parallel
        const [requestsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/requests'),
          fetch('/api/categories')
        ]);
        
        if (!requestsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const requestsData = await requestsResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        setRequests(requestsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  const handleCreateRequest = () => {
    router.push('/requests/new');
  };
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        {error}
      </div>
    );
  }
  
  return (
    <div className="flex">
      {/* Sidebar for desktop */}
      <div className="hidden lg:block w-64 shrink-0 border-r h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto p-4">
        <h3 className="font-semibold mb-2">Categories</h3>
        <div className="space-y-1 mb-6">
          {categories.map(category => (
            <button 
              key={category.id}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-muted"
            >
              {category.name}
            </button>
          ))}
        </div>
        
        <h3 className="font-semibold mb-2">Sort By</h3>
        <div className="space-y-1">
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted">
            Most Recent
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted">
            Most Votes
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-background border-r p-6">
            <button 
              onClick={toggleSidebar}
              className="absolute top-4 right-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <h3 className="font-semibold mb-2 mt-6">Categories</h3>
            <div className="space-y-1 mb-6">
              {categories.map(category => (
                <button 
                  key={category.id}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-muted"
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            <h3 className="font-semibold mb-2">Sort By</h3>
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted">
                Most Recent
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted">
                Most Votes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <button 
              className="lg:hidden inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 bg-background"
              aria-label="Toggle sidebar"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-4xl font-bold">
                All Lesson Requests
              </h1>
              <p className="text-muted-foreground mt-2">
                Browse and vote on lesson requests or create your own
              </p>

              <Button 
                onClick={handleCreateRequest}
                className="mt-4"
                data-testid="create-request-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </div>
          </div>
          
          {/* Request grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.length > 0 ? (
              requests.map(request => (
                <div key={request.id} className="bg-card rounded-lg border shadow-sm p-4">
                  <h3 className="font-semibold mb-2">{request.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{request.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {request.category}
                    </span>
                    <Button variant="outline" size="sm">
                      Vote ({request.votes})
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No requests found</p>
                <Button onClick={handleCreateRequest}>Create the first request</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Loader2, Plus, Menu } from 'lucide-react';

export default function RequestsClient() {
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch requests and categories in parallel
        const [requestsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/requests'),
          fetch('/api/categories')
        ]);
        
        if (!requestsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const requestsData = await requestsResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        setRequests(requestsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  const handleCreateRequest = () => {
    router.push('/requests/new');
  };
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        {error}
      </div>
    );
  }
  
  return (
    <div className="flex">
      {/* Sidebar for desktop */}
      <div className="hidden lg:block w-64 shrink-0 border-r h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto p-4">
        <h3 className="font-semibold mb-2">Categories</h3>
        <div className="space-y-1 mb-6">
          {categories.map(category => (
            <button 
              key={category.id}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-muted"
            >
              {category.name}
            </button>
          ))}
        </div>
        
        <h3 className="font-semibold mb-2">Sort By</h3>
        <div className="space-y-1">
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted">
            Most Recent
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted">
            Most Votes
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-background border-r p-6">
            <button 
              onClick={toggleSidebar}
              className="absolute top-4 right-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <h3 className="font-semibold mb-2 mt-6">Categories</h3>
            <div className="space-y-1 mb-6">
              {categories.map(category => (
                <button 
                  key={category.id}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-muted"
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            <h3 className="font-semibold mb-2">Sort By</h3>
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted">
                Most Recent
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted">
                Most Votes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <button 
              className="lg:hidden inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 bg-background"
              aria-label="Toggle sidebar"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-4xl font-bold">
                All Lesson Requests
              </h1>
              <p className="text-muted-foreground mt-2">
                Browse and vote on lesson requests or create your own
              </p>

              <Button 
                onClick={handleCreateRequest}
                className="mt-4"
                data-testid="create-request-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </div>
          </div>
          
          {/* Request grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.length > 0 ? (
              requests.map(request => (
                <div key={request.id} className="bg-card rounded-lg border shadow-sm p-4">
                  <h3 className="font-semibold mb-2">{request.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{request.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {request.category}
                    </span>
                    <Button variant="outline" size="sm">
                      Vote ({request.votes})
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No requests found</p>
                <Button onClick={handleCreateRequest}>Create the first request</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
