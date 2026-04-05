'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { CreatePost, PostCard, PostCardSkeleton } from '@/components/feed';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/lib/posts';
import { friendService } from '@/lib/friends';
import { storyService, type StoryGroup } from '@/lib/stories';
import { bookmarkService } from '@/lib/bookmarks';
import { uploadService } from '@/lib/upload';
import type { Post, User } from '@/types';
import type { FriendRequest } from '@/lib/friends';

type ActiveView = 'feed' | 'bookmarks' | 'friends' | 'settings';

export default function FeedPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('feed');

  // Dynamic data
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [sendingRequest, setSendingRequest] = useState<Set<string>>(new Set());
  const [viewingStory, setViewingStory] = useState<{ group: StoryGroup; index: number } | null>(null);
  const [storyUploading, setStoryUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  const loadPosts = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) setIsLoading(true); else setIsLoadingMore(true);
    try {
      const result = await postService.getPosts(pageNum, 10);
      if (append) setPosts((prev) => [...prev, ...result.posts]); else setPosts(result.posts);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (error: any) { toast.error(error.message || 'Failed to load posts'); }
    finally { setIsLoading(false); setIsLoadingMore(false); }
  }, []);

  const loadSidebar = useCallback(async () => {
    try {
      const [sug, fri, req, stories] = await Promise.all([
        friendService.getSuggestions(), friendService.getFriends(),
        friendService.getPendingRequests(), storyService.getStories(),
      ]);
      setSuggestions(sug); setFriends(fri); setPendingRequests(req); setStoryGroups(stories);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (isAuthenticated) { loadPosts(1); loadSidebar(); }
  }, [isAuthenticated, loadPosts, loadSidebar]);

  const handlePostCreated = (newPost: Post) => setPosts((prev) => [newPost, ...prev]);
  const handlePostDeleted = (postId: string) => setPosts((prev) => prev.filter((p) => p._id !== postId));
  const handleLoadMore = () => { if (!isLoadingMore && hasMore) loadPosts(page + 1, true); };

  const handleSendRequest = async (userId: string) => {
    setSendingRequest((prev) => new Set(prev).add(userId));
    try { await friendService.sendRequest(userId); toast.success('Friend request sent!'); setSuggestions((prev) => prev.filter((u) => u._id !== userId)); }
    catch (error: any) { toast.error(error.message || 'Failed'); }
    finally { setSendingRequest((prev) => { const n = new Set(prev); n.delete(userId); return n; }); }
  };

  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    try { await friendService.acceptRequest(requestId); toast.success(`${senderName} is now your friend!`); setPendingRequests((prev) => prev.filter((r) => r._id !== requestId)); loadSidebar(); }
    catch (error: any) { toast.error(error.message || 'Failed'); }
  };

  const handleRejectRequest = async (requestId: string) => {
    try { await friendService.rejectRequest(requestId); setPendingRequests((prev) => prev.filter((r) => r._id !== requestId)); }
    catch (error: any) { toast.error(error.message || 'Failed'); }
  };

  const handleViewBookmarks = async () => {
    setActiveView('bookmarks');
    try { const bm = await bookmarkService.getBookmarks(); setBookmarkedPosts(bm); } catch { /* */ }
  };

  const handleStoryImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only images'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setStoryUploading(true);
    try { const uploaded = await uploadService.uploadImage(file); await storyService.createStory({ imageUrl: uploaded.url }); toast.success('Story posted!'); loadSidebar(); }
    catch (error: any) { toast.error(error.message || 'Failed'); }
    finally { setStoryUploading(false); }
  };

  if (authLoading) {
    return (
      <div className="_layout _layout_main_wrapper min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color5)]"></div>
      </div>
    );
  }

  // Render middle content based on active view
  const renderMiddleContent = () => {
    if (activeView === 'bookmarks') {
      return (
        <div>
          <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 _mar_b16">
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color6)' }}>Bookmarked Posts</h3>
            <button onClick={() => setActiveView('feed')} style={{ fontSize: 13, color: '#1890FF', cursor: 'pointer', background: 'none', border: 'none', marginTop: 4 }}>← Back to Feed</button>
          </div>
          {bookmarkedPosts.length === 0 ? (
            <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 text-center">
              <div className="text-6xl mb-4">🔖</div>
              <h3 className="text-xl font-semibold text-[var(--color6)] _mar_b8">No bookmarks yet</h3>
              <p className="text-[var(--color7)]">Save posts to find them here later!</p>
            </div>
          ) : bookmarkedPosts.map((post) => <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />)}
        </div>
      );
    }
    if (activeView === 'friends') {
      return (
        <div>
          <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 _mar_b16">
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color6)' }}>Find Friends</h3>
            <button onClick={() => setActiveView('feed')} style={{ fontSize: 13, color: '#1890FF', cursor: 'pointer', background: 'none', border: 'none', marginTop: 4 }}>← Back to Feed</button>
          </div>
          {pendingRequests.length > 0 && (
            <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 _mar_b16">
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Friend Requests ({pendingRequests.length})</h4>
              {pendingRequests.map((req) => (
                <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={(req.sender as any).avatar || '/assets/images/txt_img.png'} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    <div><p style={{ fontWeight: 600, fontSize: 14 }}>{(req.sender as any).firstName} {(req.sender as any).lastName}</p></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleAcceptRequest(req._id, (req.sender as any).firstName)} style={{ padding: '6px 16px', background: '#1890FF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Accept</button>
                    <button onClick={() => handleRejectRequest(req._id)} style={{ padding: '6px 16px', background: '#f5f5f5', color: '#666', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24">
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>People You May Know</h4>
            {suggestions.length === 0 ? <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>No suggestions available</p> :
              suggestions.map((person) => (
                <div key={person._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={person.avatar || '/assets/images/txt_img.png'} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    <div><p style={{ fontWeight: 600, fontSize: 14 }}>{person.firstName} {person.lastName}</p><p style={{ fontSize: 12, color: '#999' }}>{person.email}</p></div>
                  </div>
                  <button onClick={() => handleSendRequest(person._id)} disabled={sendingRequest.has(person._id)} style={{ padding: '6px 20px', background: '#1890FF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', opacity: sendingRequest.has(person._id) ? 0.6 : 1 }}>{sendingRequest.has(person._id) ? '...' : 'Connect'}</button>
                </div>
              ))
            }
          </div>
        </div>
      );
    }
    if (activeView === 'settings') {
      return (
        <div>
          <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 _mar_b16">
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color6)' }}>Settings</h3>
            <button onClick={() => setActiveView('feed')} style={{ fontSize: 13, color: '#1890FF', cursor: 'pointer', background: 'none', border: 'none', marginTop: 4 }}>← Back to Feed</button>
          </div>
          <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <img src={user?.avatar || '/assets/images/txt_img.png'} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
              <div><h4 style={{ fontSize: 18, fontWeight: 600 }}>{user?.firstName} {user?.lastName}</h4><p style={{ fontSize: 14, color: '#999' }}>{user?.email}</p></div>
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Friends: {friends.length}</p>
              <p style={{ fontSize: 14, color: '#666' }}>Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      );
    }
    // Default: feed
    return (
      <>
        <CreatePost onPostCreated={handlePostCreated} />
        <div className="_feed_posts_list">
          {isLoading ? (<><PostCardSkeleton /><PostCardSkeleton /><PostCardSkeleton /></>) :
            posts.length === 0 ? (
              <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-[var(--color6)] _mar_b8">No posts yet</h3>
                <p className="text-[var(--color7)]">Be the first to share something!</p>
              </div>
            ) : (
              <>
                {posts.map((post) => <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />)}
                {hasMore && (
                  <div className="text-center _mar_t16 _mar_b16">
                    <button onClick={handleLoadMore} disabled={isLoadingMore} className="_feed_inner_text_area_btn_link px-8 py-3 rounded-lg">{isLoadingMore ? 'Loading...' : 'Load More Posts'}</button>
                  </div>
                )}
                {!hasMore && posts.length > 0 && <p className="text-center text-[var(--color7)] _padd_t24 _padd_b24">You&apos;ve reached the end of the feed 🎉</p>}
              </>
            )}
        </div>
      </>
    );
  };

  return (
    <div className="_layout _layout_main_wrapper">
      <Navbar />

      <div className="_main_layout">
        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              {/* ===== LEFT SIDEBAR ===== */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12 _hide_mobile">
                <div className="_layout_left_sidebar_wrap">
                  {/* Explore Section - from original HTML */}
                  <div className="_layout_left_sidebar_inner">
                    <div className="_left_inner_area_explore _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
                      <h4 className="_left_inner_area_explore_title _title5 _mar_b24">Explore</h4>
                      <ul className="_left_inner_area_explore_list">
                        <li className="_left_inner_area_explore_item _explore_item">
                          <a onClick={() => setActiveView('feed')} className="_left_inner_area_explore_link" style={{ cursor: 'pointer' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><path fill="#666" d="M10 0c5.523 0 10 4.477 10 10s-4.477 10-10 10S0 15.523 0 10 4.477 0 10 0zm0 1.395a8.605 8.605 0 100 17.21 8.605 8.605 0 000-17.21zm-1.233 4.65l.104.01c.188.028.443.113.668.203 1.026.398 3.033 1.746 3.8 2.563l.223.239.08.092a1.16 1.16 0 01.025 1.405c-.04.053-.086.105-.19.215l-.269.28c-.812.794-2.57 1.971-3.569 2.391-.277.117-.675.25-.865.253a1.167 1.167 0 01-1.07-.629c-.053-.104-.12-.353-.171-.586l-.051-.262c-.093-.57-.143-1.437-.142-2.347l.001-.288c.01-.858.063-1.64.157-2.147.037-.207.12-.563.167-.678.104-.25.291-.45.523-.575a1.15 1.15 0 01.58-.14zm.14 1.467l-.027.126-.034.198c-.07.483-.112 1.233-.111 2.036l.001.279c.009.737.053 1.414.123 1.841l.048.235.192-.07c.883-.372 2.636-1.56 3.23-2.2l.08-.087-.212-.218c-.711-.682-2.38-1.79-3.167-2.095l-.124-.045z" /></svg>Learning
                          </a> <span className="_left_inner_area_explore_link_txt">New</span>
                        </li>
                        <li className="_left_inner_area_explore_item">
                          <a onClick={() => setActiveView('feed')} className="_left_inner_area_explore_link" style={{ cursor: 'pointer' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24"><path fill="#666" d="M14.96 2c3.101 0 5.159 2.417 5.159 5.893v8.214c0 3.476-2.058 5.893-5.16 5.893H6.989c-3.101 0-5.159-2.417-5.159-5.893V7.893C1.83 4.42 3.892 2 6.988 2h7.972zm0 1.395H6.988c-2.37 0-3.883 1.774-3.883 4.498v8.214c0 2.727 1.507 4.498 3.883 4.498h7.972c2.375 0 3.883-1.77 3.883-4.498V7.893c0-2.727-1.508-4.498-3.883-4.498zM7.036 9.63c.323 0 .59.263.633.604l.005.094v6.382c0 .385-.285.697-.638.697-.323 0-.59-.262-.632-.603l-.006-.094v-6.382c0-.385.286-.697.638-.697zm3.97-3.053c.323 0 .59.262.632.603l.006.095v9.435c0 .385-.285.697-.638.697-.323 0-.59-.262-.632-.603l-.006-.094V7.274c0-.386.286-.698.638-.698zm3.905 6.426c.323 0 .59.262.632.603l.006.094v3.01c0 .385-.285.697-.638.697-.323 0-.59-.262-.632-.603l-.006-.094v-3.01c0-.385.286-.697.638-.697z" /></svg>Insights
                          </a>
                        </li>
                        <li className="_left_inner_area_explore_item">
                          <a onClick={() => setActiveView('friends')} className="_left_inner_area_explore_link" style={{ cursor: 'pointer' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24"><path fill="#666" d="M9.032 14.456l.297.002c4.404.041 6.907 1.03 6.907 3.678 0 2.586-2.383 3.573-6.615 3.654l-.589.005c-4.588 0-7.203-.972-7.203-3.68 0-2.704 2.604-3.659 7.203-3.659zm0 1.5l-.308.002c-3.645.038-5.523.764-5.523 2.157 0 1.44 1.99 2.18 5.831 2.18 3.847 0 5.832-.728 5.832-2.159 0-1.44-1.99-2.18-5.832-2.18zm8.53-8.037c.347 0 .634.282.679.648l.006.102v1.255h1.185c.38 0 .686.336.686.75 0 .38-.258.694-.593.743l-.093.007h-1.185v1.255c0 .414-.307.75-.686.75-.347 0-.634-.282-.68-.648l-.005-.102-.001-1.255h-1.183c-.379 0-.686-.336-.686-.75 0-.38.258-.694.593-.743l.093-.007h1.183V8.669c0-.414.308-.75.686-.75zM9.031 2c2.698 0 4.864 2.369 4.864 5.319 0 2.95-2.166 5.318-4.864 5.318-2.697 0-4.863-2.369-4.863-5.318C4.17 4.368 6.335 2 9.032 2zm0 1.5c-1.94 0-3.491 1.697-3.491 3.819 0 2.12 1.552 3.818 3.491 3.818 1.94 0 3.492-1.697 3.492-3.818 0-2.122-1.551-3.818-3.492-3.818z" /></svg>Find friends
                          </a>
                        </li>
                        <li className="_left_inner_area_explore_item">
                          <a onClick={handleViewBookmarks} className="_left_inner_area_explore_link" style={{ cursor: 'pointer' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24"><path fill="#666" d="M13.704 2c2.8 0 4.585 1.435 4.585 4.258V20.33c0 .443-.157.867-.436 1.18-.279.313-.658.489-1.063.489a1.456 1.456 0 01-.708-.203l-5.132-3.134-5.112 3.14c-.615.36-1.361.194-1.829-.405l-.09-.126-.085-.155a1.913 1.913 0 01-.176-.786V6.434C3.658 3.5 5.404 2 8.243 2h5.46zm0 1.448h-5.46c-2.191 0-3.295.948-3.295 2.986V20.32c0 .044.01.088 0 .07l.034.063c.059.09.17.12.247.074l5.11-3.138c.38-.23.84-.23 1.222.001l5.124 3.128a.252.252 0 00.114.035.188.188 0 00.14-.064.236.236 0 00.058-.157V6.258c0-1.9-1.132-2.81-3.294-2.81zm.386 4.869c.357 0 .646.324.646.723 0 .367-.243.67-.559.718l-.087.006H7.81c-.357 0-.646-.324-.646-.723 0-.367.243-.67.558-.718l.088-.006h6.28z" /></svg>Bookmarks
                          </a>
                        </li>
                        <li className="_left_inner_area_explore_item">
                          <a onClick={() => setActiveView('feed')} className="_left_inner_area_explore_link" style={{ cursor: 'pointer' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>Group
                          </a>
                        </li>
                        <li className="_left_inner_area_explore_item _explore_item">
                          <a onClick={() => setActiveView('feed')} className="_left_inner_area_explore_link" style={{ cursor: 'pointer' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24"><path fill="#666" d="M7.625 2c.315-.015.642.306.645.69.003.309.234.558.515.558h.928c1.317 0 2.402 1.169 2.419 2.616v.24h2.604c2.911-.026 5.255 2.337 5.377 5.414.005.12.006.245.004.368v4.31c.062 3.108-2.21 5.704-5.064 5.773-.117.003-.228 0-.34-.005a199.325 199.325 0 01-7.516 0c-2.816.132-5.238-2.292-5.363-5.411a6.262 6.262 0 01-.004-.371V11.87c-.03-1.497.48-2.931 1.438-4.024.956-1.094 2.245-1.714 3.629-1.746a3.28 3.28 0 01.342.005l3.617-.001v-.231c-.008-.676-.522-1.23-1.147-1.23h-.93c-.973 0-1.774-.866-1.785-1.937-.003-.386.28-.701.631-.705z" /></svg>Gaming
                          </a> <span className="_left_inner_area_explore_link_txt">New</span>
                        </li>
                        <li className="_left_inner_area_explore_item">
                          <a onClick={() => setActiveView('settings')} className="_left_inner_area_explore_link" style={{ cursor: 'pointer' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#666" d="M12.616 2c.71 0 1.388.28 1.882.779.495.498.762 1.17.74 1.799l.009.147c.017.146.065.286.144.416.152.255.402.44.695.514.292.074.602.032.896-.137l.164-.082c1.23-.567 2.705-.117 3.387 1.043l.613 1.043c.017.027.03.056.043.085l.057.111a2.537 2.537 0 01-.884 3.204l-.257.159a1.102 1.102 0 00-.33.356 1.093 1.093 0 00-.117.847c.078.287.27.53.56.695l.166.105c.505.346.869.855 1.028 1.439.18.659.083 1.36-.272 1.957l-.66 1.077-.1.152c-.774 1.092-2.279 1.425-3.427.776l-.136-.069a1.19 1.19 0 00-.435-.1 1.128 1.128 0 00-1.143 1.154l-.008.171C15.12 20.971 13.985 22 12.616 22h-1.235c-1.449 0-2.623-1.15-2.622-2.525l-.008-.147a1.045 1.045 0 00-.148-.422 1.125 1.125 0 00-.688-.519c-.29-.076-.6-.035-.9.134l-.177.087a2.674 2.674 0 01-1.794.129 2.606 2.606 0 01-1.57-1.215l-.637-1.078-.085-.16a2.527 2.527 0 011.03-3.296l.104-.065c.309-.21.494-.554.494-.923 0-.401-.219-.772-.6-.989l-.156-.097a2.542 2.542 0 01-.764-3.407l.65-1.045a2.646 2.646 0 013.552-.96l.134.07c.135.06.283.093.425.094.626 0 1.137-.492 1.146-1.124l.009-.194a2.54 2.54 0 01.752-1.593A2.642 2.642 0 0111.381 2h1.235z" /></svg>Settings
                          </a>
                        </li>
                        <li className="_left_inner_area_explore_item">
                          <a onClick={handleViewBookmarks} className="_left_inner_area_explore_link" style={{ cursor: 'pointer' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>Save post
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Suggested People - Real Data from DB */}
                  <div className="_layout_left_sidebar_inner">
                    <div className="_left_inner_area_suggest _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
                      <div className="_left_inner_area_suggest_content _mar_b24">
                        <h4 className="_left_inner_area_suggest_content_title _title5">Suggested People</h4>
                        <span className="_left_inner_area_suggest_content_txt">
                          <a className="_left_inner_area_suggest_content_txt_link" onClick={() => setActiveView('friends')} style={{ cursor: 'pointer' }}>See All</a>
                        </span>
                      </div>
                      
                      {suggestions.slice(0, 3).map((person, idx) => (
                        <div key={person._id} className="_left_inner_area_suggest_info">
                          <div className="_left_inner_area_suggest_info_box">
                            <div className="_left_inner_area_suggest_info_image">
                              <a><img src={person.avatar || `/assets/images/people${(idx % 3) + 1}.png`} alt="Image" className="_info_img" /></a>
                            </div>
                            <div className="_left_inner_area_suggest_info_txt">
                              <a><h4 className="_left_inner_area_suggest_info_title">{person.firstName} {person.lastName}</h4></a>
                              <p className="_left_inner_area_suggest_info_para">{person.email}</p>
                            </div>
                          </div>
                          <div className="_left_inner_area_suggest_info_link">
                            <button onClick={() => handleSendRequest(person._id)} disabled={sendingRequest.has(person._id)} className="_info_link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                              {sendingRequest.has(person._id) ? '...' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      ))}
                      {suggestions.length === 0 && (
                        <p style={{ fontSize: 13, color: '#999', textAlign: 'center', padding: '8px 0' }}>No suggestions right now</p>
                      )}
                    </div>
                  </div>

                  {/* Events - from original HTML */}
                  <div className="_layout_left_sidebar_inner">
                    <div className="_left_inner_area_event _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
                      <div className="_left_inner_event_content">
                        <h4 className="_left_inner_event_title _title5">Events</h4>
                        <a href="#" className="_left_inner_event_link">See all</a>
                      </div>
                      
                      {[1, 2].map((i) => (
                        <a key={i} className="_left_inner_event_card_link" href="#">
                          <div className="_left_inner_event_card">
                            <div className="_left_inner_event_card_iamge">
                              <img src="/assets/images/feed_event1.png" alt="Image" className="_card_img" />
                            </div>
                            <div className="_left_inner_event_card_content">
                              <div className="_left_inner_card_date">
                                <p className="_left_inner_card_date_para">10</p>
                                <p className="_left_inner_card_date_para1">Jul</p>
                              </div>
                              <div className="_left_inner_card_txt">
                                <h4 className="_left_inner_event_card_title">No more terrorism no more cry</h4>
                              </div>
                            </div>
                            <hr className="_underline" />
                            <div className="_left_inner_event_bottom">
                              <p className="_left_iner_event_bottom">17 People Going</p>
                              <a href="#" className="_left_iner_event_bottom_link">Going</a>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== MIDDLE CONTENT ===== */}
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">
                    {/* Stories Section */}
                    <div className="_feed_inner_ppl_card _mar_b16">
                      <div className="_feed_inner_story_arrow">
                        <button type="button" className="_feed_inner_story_arrow_btn">
                          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" fill="none" viewBox="0 0 9 8"><path fill="#fff" d="M8 4l.366-.341.318.341-.318.341L8 4zm-7 .5a.5.5 0 010-1v1zM5.566.659l2.8 3-.732.682-2.8-3L5.566.66zm2.8 3.682l-2.8 3-.732-.682 2.8-3 .732.682zM8 4.5H1v-1h7v1z" /></svg>
                        </button>
                      </div>
                      <div className="row">
                        {/* Your Story */}
                        <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 col">
                          <div className="_feed_inner_profile_story _b_radious6">
                            <div className="_feed_inner_profile_story_image">
                              <img src={user?.avatar || '/assets/images/card_ppl1.png'} alt="Image" className="_profile_story_img" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                              <div className="_feed_inner_story_txt">
                                <div className="_feed_inner_story_btn">
                                  <label htmlFor="story-upload" className="_feed_inner_story_btn_link" style={{ cursor: storyUploading ? 'wait' : 'pointer' }}>
                                    {storyUploading ? <span style={{ fontSize: 10 }}>...</span> : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 10 10"><path stroke="#fff" strokeLinecap="round" d="M.5 4.884h9M4.884 9.5v-9" /></svg>
                                    )}
                                  </label>
                                  <input id="story-upload" type="file" accept="image/*" onChange={handleStoryImageSelect} style={{ display: 'none' }} />
                                </div>
                                <p className="_feed_inner_story_para">Your Story</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Other Stories - from DB or fallback to static */}
                        {(storyGroups.length > 0 ? storyGroups.slice(0, 3) : [null, null, null]).map((group, i) => (
                          <div key={i} className={`col-xl-3 col-lg-3 col-md-4 col-sm-4 ${i === 2 ? '_custom_none' : i === 1 ? '_custom_mobile_none' : ''} col`}>
                            <div className="_feed_inner_public_story _b_radious6" onClick={() => group && setViewingStory({ group, index: 0 })} style={{ cursor: group ? 'pointer' : 'default' }}>
                              <div className="_feed_inner_public_story_image">
                                <img src={group ? group.stories[0]?.imageUrl : `/assets/images/card_ppl${i + 2}.png`} alt="Image" className="_public_story_img" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                                <div className="_feed_inner_pulic_story_txt">
                                  <p className="_feed_inner_pulic_story_para">{group ? `${(group.author as any).firstName} ${(group.author as any).lastName}` : 'Ryan Roslansky'}</p>
                                </div>
                                <div className="_feed_inner_public_mini">
                                  <img src={group ? ((group.author as any).avatar || '/assets/images/mini_pic.png') : '/assets/images/mini_pic.png'} alt="Image" className="_public_mini_img" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Middle Content */}
                    {renderMiddleContent()}
                  </div>
                </div>
              </div>

              {/* ===== RIGHT SIDEBAR ===== */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12 _hide_mobile">
                <div className="_layout_right_sidebar_wrap">
                  {/* Friend Requests */}
                  {pendingRequests.length > 0 && (
                    <div className="_layout_right_sidebar_inner">
                      <div className="_right_inner_area_info _padd_t24 _padd_b24 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
                        <div className="_right_inner_area_info_content _mar_b24">
                          <h4 className="_right_inner_area_info_content_title _title5">Friend Requests</h4>
                          <span className="_right_inner_area_info_content_txt"><span className="_right_inner_area_info_content_txt_link">{pendingRequests.length} new</span></span>
                        </div>
                        <hr className="_underline" />
                        {pendingRequests.slice(0, 3).map((req) => (
                          <div key={req._id} className="_right_inner_area_info_ppl">
                            <div className="_right_inner_area_info_box">
                              <div className="_right_inner_area_info_box_image">
                                <img src={(req.sender as any).avatar || '/assets/images/recommend_mini.png'} alt="Image" className="_recommend_img" />
                              </div>
                              <div className="_right_inner_area_info_box_txt">
                                <h4 className="_right_inner_area_info_box_title">{(req.sender as any).firstName} {(req.sender as any).lastName}</h4>
                                <p className="_right_inner_area_info_box_para">{(req.sender as any).email}</p>
                              </div>
                            </div>
                            <div className="_right_info_btn_grp">
                              <button type="button" className="_right_info_btn_link" onClick={() => handleRejectRequest(req._id)}>Ignore</button>
                              <button type="button" className="_right_info_btn_link _right_info_btn_link_active" onClick={() => handleAcceptRequest(req._id, (req.sender as any).firstName)}>Accept</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* You Might Like - from original HTML */}
                  <div className="_layout_right_sidebar_inner">
                    <div className="_right_inner_area_info _padd_t24 _padd_b24 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
                      <div className="_right_inner_area_info_content _mar_b24">
                        <h4 className="_right_inner_area_info_content_title _title5">You Might Like</h4>
                        <span className="_right_inner_area_info_content_txt">
                          <a className="_right_inner_area_info_content_txt_link" onClick={() => setActiveView('friends')} style={{ cursor: 'pointer' }}>See All</a>
                        </span>
                      </div>
                      <hr className="_underline" />
                      
                      {suggestions.slice(0, 1).map((person) => (
                        <div key={person._id} className="_right_inner_area_info_ppl">
                          <div className="_right_inner_area_info_box">
                            <div className="_right_inner_area_info_box_image">
                              <img src={person.avatar || '/assets/images/recommend_mini.png'} alt="Image" className="_recommend_img" />
                            </div>
                            <div className="_right_inner_area_info_box_txt">
                              <h4 className="_right_inner_area_info_box_title">{person.firstName} {person.lastName}</h4>
                              <p className="_right_inner_area_info_box_para">{person.email}</p>
                            </div>
                          </div>
                          <div className="_right_info_btn_grp">
                            <button type="button" className="_right_info_btn_link">Ignore</button>
                            <button type="button" className="_right_info_btn_link _right_info_btn_link_active" onClick={() => handleSendRequest(person._id)}>Follow</button>
                          </div>
                        </div>
                      ))}
                      {suggestions.length === 0 && (
                        <div className="_right_inner_area_info_ppl">
                          <div className="_right_inner_area_info_box">
                            <div className="_right_inner_area_info_box_image"><img src="/assets/images/recommend_mini.png" alt="Image" className="_recommend_img" /></div>
                            <div className="_right_inner_area_info_box_txt"><h4 className="_right_inner_area_info_box_title">Radovan SkillArena</h4><p className="_right_inner_area_info_box_para">Founder & CEO at Trophy</p></div>
                          </div>
                          <div className="_right_info_btn_grp"><button type="button" className="_right_info_btn_link">Ignore</button><button type="button" className="_right_info_btn_link _right_info_btn_link_active">Follow</button></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Your Friends - Real Data */}
                  <div className="_layout_right_sidebar_inner">
                    <div className="_feed_right_inner_area_card _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
                      <div className="_feed_top_fixed">
                        <div className="_feed_right_inner_area_card_content _mar_b24">
                          <h4 className="_feed_right_inner_area_card_content_title _title5">Your Friends</h4>
                          <span className="_feed_right_inner_area_card_content_txt">
                            <a className="_feed_right_inner_area_card_content_txt_link" onClick={() => setActiveView('friends')} style={{ cursor: 'pointer' }}>See All</a>
                          </span>
                        </div>
                        <form className="_feed_right_inner_area_card_form">
                          <svg className="_feed_right_inner_area_card_form_svg" xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 17 17"><circle cx="7" cy="7" r="6" stroke="#666"></circle><path stroke="#666" strokeLinecap="round" d="M16 16l-3-3"></path></svg>
                          <input className="form-control me-2 _feed_right_inner_area_card_form_inpt" type="search" placeholder="input search text" aria-label="Search" />
                        </form>
                      </div>
                      
                      <div className="_feed_bottom_fixed">
                        {friends.length > 0 ? friends.slice(0, 5).map((friend, idx) => (
                          <div key={friend._id} className="_feed_right_inner_area_card_ppl">
                            <div className="_feed_right_inner_area_card_ppl_box">
                              <div className="_feed_right_inner_area_card_ppl_image">
                                <a><img src={friend.avatar || `/assets/images/people${(idx % 3) + 1}.png`} alt="" className="_box_ppl_img" /></a>
                              </div>
                              <div className="_feed_right_inner_area_card_ppl_txt">
                                <a><h4 className="_feed_right_inner_area_card_ppl_title">{friend.firstName} {friend.lastName}</h4></a>
                                <p className="_feed_right_inner_area_card_ppl_para">{friend.email}</p>
                              </div>
                            </div>
                            <div className="_feed_right_inner_area_card_ppl_side">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 14 14"><rect width="12" height="12" x="1" y="1" fill="#0ACF83" stroke="#fff" strokeWidth="2" rx="6" /></svg>
                            </div>
                          </div>
                        )) : (
                          <>
                            {['Steve Jobs', 'Ryan Roslansky', 'Dylan Field'].map((name, idx) => (
                              <div key={idx} className="_feed_right_inner_area_card_ppl">
                                <div className="_feed_right_inner_area_card_ppl_box">
                                  <div className="_feed_right_inner_area_card_ppl_image"><a><img src={`/assets/images/people${idx + 1}.png`} alt="" className="_box_ppl_img" /></a></div>
                                  <div className="_feed_right_inner_area_card_ppl_txt"><a><h4 className="_feed_right_inner_area_card_ppl_title">{name}</h4></a><p className="_feed_right_inner_area_card_ppl_para">{idx === 0 ? 'CEO of Apple' : idx === 1 ? 'CEO of LinkedIn' : 'CEO of Figma'}</p></div>
                                </div>
                                <div className="_feed_right_inner_area_card_ppl_side"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 14 14"><rect width="12" height="12" x="1" y="1" fill="#0ACF83" stroke="#fff" strokeWidth="2" rx="6" /></svg></div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STORY VIEWER MODAL ===== */}
      {viewingStory && (
        <div onClick={() => setViewingStory(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: 420, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#fff' }}>
              <img src={(viewingStory.group.author as any).avatar || '/assets/images/txt_img.png'} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }} />
              <div><p style={{ fontWeight: 600, fontSize: 14 }}>{(viewingStory.group.author as any).firstName} {(viewingStory.group.author as any).lastName}</p><p style={{ fontSize: 11, color: '#ccc' }}>{new Date(viewingStory.group.stories[viewingStory.index]?.createdAt).toLocaleTimeString()}</p></div>
              <button onClick={() => setViewingStory(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <img src={viewingStory.group.stories[viewingStory.index]?.imageUrl} alt="Story" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
              <button onClick={() => { if (viewingStory.index > 0) setViewingStory({ ...viewingStory, index: viewingStory.index - 1 }); }} disabled={viewingStory.index === 0} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', opacity: viewingStory.index === 0 ? 0.3 : 1 }}>← Prev</button>
              <span style={{ color: '#fff', fontSize: 13, alignSelf: 'center' }}>{viewingStory.index + 1} / {viewingStory.group.stories.length}</span>
              <button onClick={() => { if (viewingStory.index < viewingStory.group.stories.length - 1) setViewingStory({ ...viewingStory, index: viewingStory.index + 1 }); else setViewingStory(null); }} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>{viewingStory.index < viewingStory.group.stories.length - 1 ? 'Next →' : 'Close'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
