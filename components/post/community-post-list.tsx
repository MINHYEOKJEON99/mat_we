"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PenSquare, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  author: {
    display_name: string;
  } | null;
}

interface CommunityPostListProps {
  posts: Post[];
  totalCount: number;
}

type TabType = "all" | "popular" | "notice";

export function CommunityPostList({ posts, totalCount }: CommunityPostListProps) {
  const [currentTab, setCurrentTab] = useState<TabType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("title");
  const [appliedSearch, setAppliedSearch] = useState({ query: "", filter: "title" });

  // Filter posts based on current tab
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Apply tab filter
    if (currentTab === "popular") {
      // 개념글: 추천 15 이상, 댓글 5 이상
      result = result.filter((post) => post.likes_count >= 15 && post.comments_count >= 5);
    } else if (currentTab === "notice") {
      // 공지글: 나중에 구현
      result = [];
    }

    // Apply search filter
    if (appliedSearch.query) {
      const query = appliedSearch.query.toLowerCase();
      result = result.filter((post) => {
        if (appliedSearch.filter === "title") {
          return post.title.toLowerCase().includes(query);
        } else if (appliedSearch.filter === "content") {
          return post.content.toLowerCase().includes(query);
        } else {
          return post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query);
        }
      });
    }

    return result;
  }, [posts, currentTab, appliedSearch]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  // Calculate post numbers
  const startNumber = filteredPosts.length - (currentPage - 1) * postsPerPage;

  const handlePostsPerPageChange = (value: number) => {
    const newTotalPages = Math.max(1, Math.ceil(filteredPosts.length / value));
    setPostsPerPage(value);
    // 현재 페이지가 새로운 총 페이지 수를 초과하면 마지막 페이지로 조정
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    return date
      .toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" })
      .replace(/\. /g, ".")
      .replace(/\.$/, "");
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch({ query: searchQuery, filter: searchFilter });
    setCurrentPage(1);
  };

  const getPaginationNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 10;
    const effectiveTotal = Math.max(1, totalPages);
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(effectiveTotal, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages.length > 0 ? pages : [1];
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b mb-0">
        <div className="flex">
          <button
            onClick={() => handleTabChange("all")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              currentTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            전체글
          </button>
          <button
            onClick={() => handleTabChange("popular")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              currentTab === "popular"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            개념글
          </button>
          <button
            onClick={() => handleTabChange("notice")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              currentTab === "notice"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            공지
          </button>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <select
            value={postsPerPage}
            onChange={(e) => handlePostsPerPageChange(Number(e.target.value))}
            className="h-8 px-2 text-xs border rounded bg-background"
          >
            <option value={30}>30개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
          <Button asChild size="sm" className="h-8">
            <Link href="/community/new">
              <PenSquare className="mr-1 h-3 w-3" />
              글쓰기
            </Link>
          </Button>
        </div>
      </div>

      {/* Post Table */}
      <div className="border border-t-0">
        {/* Table Header */}
        <div className="grid grid-cols-[60px_1fr_100px_80px_60px_50px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
          <div className="text-center">번호</div>
          <div>제목</div>
          <div className="text-center">글쓴이</div>
          <div className="text-center">작성일</div>
          <div className="text-center">조회</div>
          <div className="text-center">추천</div>
        </div>

        {/* Post Rows */}
        {paginatedPosts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {currentTab === "notice" ? (
              <p>공지 기능은 준비 중입니다.</p>
            ) : currentTab === "popular" ? (
              <p>개념글이 없습니다. (추천 15 이상, 댓글 5 이상)</p>
            ) : (
              <>
                <p>게시글이 없습니다.</p>
                <Button asChild className="mt-4">
                  <Link href="/community/new">첫 번째 게시글 작성하기</Link>
                </Button>
              </>
            )}
          </div>
        ) : (
          paginatedPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="grid grid-cols-[60px_1fr_100px_80px_60px_50px] gap-2 px-3 py-2 text-sm border-b last:border-b-0 hover:bg-accent/50 transition-colors items-center"
            >
              <div className="text-center text-xs text-muted-foreground">{startNumber - index}</div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="truncate font-medium">{post.title}</span>
                {post.comments_count > 0 && (
                  <span className="text-xs text-primary flex-shrink-0">[{post.comments_count}]</span>
                )}
              </div>
              <div className="text-center text-xs text-muted-foreground truncate">
                {post.author?.display_name || "익명"}
              </div>
              <div className="text-center text-xs text-muted-foreground">{formatDate(post.created_at)}</div>
              <div className="text-center text-xs text-muted-foreground">{post.views_count || 0}</div>
              <div className="text-center text-xs text-muted-foreground">{post.likes_count || 0}</div>
            </Link>
          ))
        )}
      </div>

      {/* Bottom Section: Tabs + Write Button */}
      <div className="flex items-center justify-end py-3">
        <Button asChild size="sm" variant="outline" className="border-primary">
          <Link href="/community/new">
            <PenSquare className="mr-1 h-3 w-3" />
            글쓰기
          </Link>
        </Button>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1 py-4">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPaginationNumbers().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => setCurrentPage(pageNum)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              currentPage === pageNum ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Search Section */}
      <form onSubmit={handleSearch} className="flex items-center justify-center gap-2 py-4">
        <select
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="h-9 px-3 text-sm border rounded bg-background"
        >
          <option value="title">제목</option>
          <option value="content">내용</option>
          <option value="title_content">제목+내용</option>
        </select>
        <Input
          type="text"
          placeholder="검색어를 입력하세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 h-9"
        />
        <Button type="submit" size="sm" className="h-9 px-4">
          <Search className="h-4 w-4" />
        </Button>
      </form>
    </>
  );
}
