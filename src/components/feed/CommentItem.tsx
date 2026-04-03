'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Button, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { commentService } from '@/lib/comments';
import type { Comment, User } from '@/types';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onDelete: (commentId: string) => void;
  onReplyAdded: () => void;
  isReply?: boolean;
}

export function CommentItem({ comment, postId, onDelete, onReplyAdded, isReply = false }: CommentItemProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(comment.isLikedByMe);
  const [likeCount, setLikeCount] = useState(comment._count.likes);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [likers, setLikers] = useState<User[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [replyCount, setReplyCount] = useState(comment._count.replies);

  const isAuthor = user?._id === comment.author._id;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like');
      return;
    }

    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    setLiked(newLiked);
    setLikeCount(newCount);

    try {
      const result = await commentService.toggleLike(postId, comment._id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (error: any) {
      setLiked(!newLiked);
      setLikeCount(likeCount);
      toast.error(error.message || 'Failed to like');
    }
  };

  const handleShowReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    setShowReplies(true);
    setLoadingReplies(true);
    try {
      const data = await commentService.getReplies(postId, comment._id);
      setReplies(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load replies');
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!user) {
      toast.error('Please login to reply');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const reply = await commentService.createReply(postId, comment._id, {
        content: replyContent.trim(),
      });
      setReplies((prev) => [...prev, reply]);
      setReplyContent('');
      setShowReplyInput(false);
      setShowReplies(true);
      setReplyCount((prev) => prev + 1);
      onReplyAdded();
      toast.success('Reply added');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleShowLikers = async () => {
    setShowLikersModal(true);
    setLoadingLikers(true);
    try {
      const result = await commentService.getLikers(postId, comment._id);
      setLikers(result.users);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load likers');
    } finally {
      setLoadingLikers(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await commentService.deleteComment(postId, replyId);
      setReplies((prev) => prev.filter((r) => r._id !== replyId));
      setReplyCount((prev) => prev - 1);
      toast.success('Reply deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete reply');
    }
  };

  return (
    <div className={`${isReply ? 'ml-10' : ''}`}>
      <div className="flex gap-2">
        <Avatar
          src={comment.author.avatar}
          name={`${comment.author.firstName} ${comment.author.lastName}`}
          size="sm"
        />
        <div className="flex-1">
          <div className="bg-[var(--color-bg-tertiary)] rounded-2xl px-3 py-2">
            <p className="font-semibold text-sm text-[var(--color-text-primary)]">
              {comment.author.firstName} {comment.author.lastName}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4 mt-1 ml-2">
            <span className="text-xs text-[var(--color-text-muted)]">{timeAgo}</span>
            
            <button
              onClick={handleLike}
              className={`text-xs font-medium ${liked ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
            >
              {liked ? 'Liked' : 'Like'}
            </button>
            
            {!isReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                Reply
              </button>
            )}

            {likeCount > 0 && (
              <button
                onClick={handleShowLikers}
                className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
              >
                <Heart size={12} fill="currentColor" className="text-[var(--color-error)]" />
                {likeCount}
              </button>
            )}

            {isAuthor && (
              <button
                onClick={() => onDelete(comment._id)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && user && (
            <form onSubmit={handleSubmitReply} className="mt-2 flex gap-2">
              <Avatar
                src={user.avatar}
                name={`${user.firstName} ${user.lastName}`}
                size="sm"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${comment.author.firstName}...`}
                  className="flex-1 px-3 py-1.5 bg-[var(--color-bg-tertiary)] rounded-full text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim() || isSubmittingReply}
                  isLoading={isSubmittingReply}
                  className="rounded-full px-3"
                >
                  <Send size={14} />
                </Button>
              </div>
            </form>
          )}

          {/* Show Replies Button */}
          {!isReply && replyCount > 0 && (
            <button
              onClick={handleShowReplies}
              className="flex items-center gap-1 mt-2 ml-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showReplies ? 'Hide' : 'View'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {/* Replies */}
          {showReplies && !isReply && (
            <div className="mt-2 space-y-2">
              {loadingReplies ? (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
                </div>
              ) : (
                replies.map((reply) => (
                  <CommentItem
                    key={reply._id}
                    comment={reply}
                    postId={postId}
                    onDelete={handleDeleteReply}
                    onReplyAdded={onReplyAdded}
                    isReply
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Likers Modal */}
      <Modal
        isOpen={showLikersModal}
        onClose={() => setShowLikersModal(false)}
        title="Likes"
        size="sm"
      >
        <div className="p-4">
          {loadingLikers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          ) : likers.length === 0 ? (
            <p className="text-center text-[var(--color-text-muted)] py-8">
              No likes yet
            </p>
          ) : (
            <div className="space-y-3">
              {likers.map((liker) => (
                <div key={liker._id} className="flex items-center gap-3">
                  <Avatar
                    src={liker.avatar}
                    name={`${liker.firstName} ${liker.lastName}`}
                    size="sm"
                  />
                  <p className="font-medium text-sm text-[var(--color-text-primary)]">
                    {liker.firstName} {liker.lastName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
