import React from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import LoadingState from './LoadingState';
import type { LoadingVariant } from './LoadingState';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import ErrorBoundary from './ErrorBoundary';

interface StatusContainerProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  error?: any;
  onRetry?: () => void;
  // Loading options
  loadingVariant?: LoadingVariant;
  loadingTitle?: string;
  loadingDescription?: string;
  loadingCount?: number;
  // Empty options
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  // Error options
  errorTitle?: string;
  errorMessage?: string;
  errorDetails?: string | Record<string, any>;
  // Fallback overrides
  loadingFallback?: ReactNode;
  emptyFallback?: ReactNode;
  errorFallback?: ReactNode;
  // Children & Style
  children: ReactNode;
  height?: string;
  className?: string;
}

export const StatusContainer: React.FC<StatusContainerProps> = ({
  isLoading = false,
  isError = false,
  isEmpty = false,
  error,
  onRetry,
  loadingVariant = 'spinner',
  loadingTitle,
  loadingDescription,
  loadingCount,
  emptyTitle = '표시할 데이터가 없습니다.',
  emptyDescription,
  emptyIcon,
  emptyActionLabel,
  onEmptyAction,
  errorTitle,
  errorMessage,
  errorDetails,
  loadingFallback,
  emptyFallback,
  errorFallback,
  children,
  height,
  className = '',
}) => {
  return (
    <ErrorBoundary resetKey={`${isLoading}-${isError}-${isEmpty}`}>
      {(() => {
        if (isLoading) {
          if (loadingFallback) return loadingFallback;
          return (
            <LoadingState
              variant={loadingVariant}
              title={loadingTitle}
              description={loadingDescription}
              count={loadingCount}
              height={height}
              className={className}
            />
          );
        }

        if (isError) {
          if (errorFallback) return errorFallback;
          const parsedMessage =
            errorMessage ||
            error?.response?.data?.message ||
            error?.message ||
            '데이터를 불러오는 중 오류가 발생했습니다.';
          const parsedCode =
            error?.response?.data?.errorCode || error?.code || (error?.response?.status ? `HTTP_${error.response.status}` : undefined);
          const parsedDetails = errorDetails || error?.response?.data || error?.stack;

          return (
            <ErrorState
              title={errorTitle}
              message={parsedMessage}
              errorCode={parsedCode}
              details={parsedDetails}
              onRetry={onRetry}
              height={height}
              className={className}
            />
          );
        }

        if (isEmpty) {
          if (emptyFallback) return emptyFallback;
          return (
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              icon={emptyIcon}
              actionLabel={emptyActionLabel}
              onAction={onEmptyAction || onRetry}
              height={height}
              className={className}
            />
          );
        }

        return <>{children}</>;
      })()}
    </ErrorBoundary>
  );
};

export default StatusContainer;
