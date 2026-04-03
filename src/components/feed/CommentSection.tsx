'use client';

import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { commentService } from '@/lib/comments';
import { CommentItem } from './CommentItem';
import type { Comment } from '@/types';

interface CommentSectionProps {
  postId: string;
  onCommentCountChange: (delta: number) => void;
}

export function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await commentService.getComments(postId);
      setComments(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const comment = await commentService.createComment(postId, {
        content: newComment.trim(),
      });
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
      onCommentCountChange(1);
      toast.success('Comment added');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(postId, commentId);
      const comment = comments.find((c) => c._id === commentId);
      const deletedCount = 1 + (comment?._count.replies || 0);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      onCommentCountChange(-deletedCount);
      toast.success('Comment deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete comment');
    }
  };

  const handleReplyAdded = () => {
    onCommentCountChange(1);
  };

  return (
    <div className="border-t border-[var(--color-border-light)]">
      {/* Comment Input */}
      {user && (
        <form onSubmit={handleSubmitComment} className="p-4 flex gap-3">
          <Avatar
            src={user.avatar}
            name={`${user.firstName} ${user.lastName}`}
            size="sm"
          />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 bg-[var(--color-bg-tertiary)] rounded-full text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              maxLength={2000}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || isSubmitting}
              isLoading={isSubmitting}
              className="rounded-full"
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="px-4 pb-4 space-y-4 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              onDelete={handleDeleteComment}
              onReplyAdded={handleReplyAdded}
            />
          ))
        )}
      </div>
    </div>
  );
}
