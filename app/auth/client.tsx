      const { success, error: signInError } = await signInWithGoogle();
      
      if (!success || signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError instanceof Error ? signInError.message : 'Failed to sign in with Google');
        return;
      }
      
      // Handle successful sign-in
      if (onSuccess) {
        onSuccess();
      } else {
        const redirectUrl = sessionStorage.getItem('auth-redirect');
        if (redirectUrl) {
          sessionStorage.removeItem('auth-redirect');
          router.push(redirectUrl);
        } else {
          router.push('/');
>>>>>>> e1b87e2eaf6aac7d182afa6b20e7d8a685016e84
        }
      }
    } catch (err) {
      console.error('Exception during sign in:', err);
      
      // Also handle unexpected errors that might be cookie-related
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('cookies') || 
          errorMessage.includes('this.context') || 
          errorMessage.includes('is not a function')) {
        setError('Authentication session issue detected. Refreshing the page...');
        setTimeout(() => {
          window.location.href = window.location.href;
        }, 2000);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
              <CardDescription>
                There was a problem with the authentication component.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Sign in to access your account and lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
=======
      const { success, error: signInError } = await signInWithGoogle();
      
      if (!success || signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError instanceof Error ? signInError.message : 'Failed to sign in with Google');
        return;
      }
      
      // Handle successful sign-in
      if (onSuccess) {
        onSuccess();
      } else {
        const redirectUrl = sessionStorage.getItem('auth-redirect');
        if (redirectUrl) {
          sessionStorage.removeItem('auth-redirect');
          router.push(redirectUrl);
        } else {
          router.push('/');
>>>>>>> e1b87e2eaf6aac7d182afa6b20e7d8a685016e84
        }
      }
    } catch (err) {
      console.error('Exception during sign in:', err);
      
      // Also handle unexpected errors that might be cookie-related
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('cookies') || 
          errorMessage.includes('this.context') || 
          errorMessage.includes('is not a function')) {
        setError('Authentication session issue detected. Refreshing the page...');
        setTimeout(() => {
          window.location.href = window.location.href;
        }, 2000);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
              <CardDescription>
                There was a problem with the authentication component.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Sign in to access your account and lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
