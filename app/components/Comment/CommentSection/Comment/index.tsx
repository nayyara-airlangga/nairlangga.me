import axios from "axios"
import Markdown from "markdown-to-jsx"
import { useRouter } from "next/router"
import { useState } from "react"

import { EditCommentForm } from "../EditCommentForm"
import { ReplyForm } from "../ReplyForm"
import { Body, Button } from "@components"
import { LoadStatus } from "@constants"
import { useAuth } from "@hooks"
import { Comment as CommentModel, Post } from "@models"

import DeleteIcon from "@icons/delete.svg"
import EditIcon from "@icons/edit.svg"

const Comment = ({
  replyCount,
  comment,
  post,
}: {
  replyCount: number
  comment: CommentModel
  post: Post
}) => {
  const {
    id,
    author: { name, username },
    comment: text,
    createdAt,
    editedAt,
  } = comment

  const { reload, push } = useRouter()

  const { user } = useAuth()

  const [readMore, setReadMore] = useState(false)

  const [loadStatus, setLoadStatus] = useState<LoadStatus>()

  const [editComment, setEditComment] = useState(false)
  const [showReplies, setShowReplies] = useState(false)

  const [replies, setReplies] = useState<CommentModel[]>()
  const [lastReplyId, setLastReplyId] = useState<number>()
  const [hasNextPage, setHasNextPage] = useState(false)

  const deleteComment = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    try {
      const { data } = await axios.delete(
        "/api/posts/" + post.slug + "/comments/" + id + "/delete"
      )

      if (data.status === "success") {
        reload()
      }
    } catch (error: any) {
      console.log(error.response.data.message)
      if (error.response.status === 401) {
        push("/auth")
      }
    }
  }

  const fetchReplies = async () => {
    setLoadStatus(LoadStatus.LOADING)

    try {
      const { data } = await axios.get(
        "/api/posts/" +
          post.slug +
          "/comments/" +
          comment.id +
          "/replies?" +
          (lastReplyId ? "lastId=" + lastReplyId : "")
      )

      if (data.status === "success") {
        if (!replies) {
          setReplies(data.replies)
        } else {
          setReplies(replies.concat(...data.replies))
        }
        setLastReplyId(data.lastReplyId)
        setHasNextPage(data.hasNextPage)

        setLoadStatus(LoadStatus.SUCCESS)
      }
    } catch (error: any) {
      console.log(error.response.data.message)
      setLoadStatus(LoadStatus.ERROR)
    }
  }

  const createdDate = new Date(createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })

  return (
    <section
      id={`comment-${id}`}
      className="mb-2 flex space-x-4 justify-between items-start break-words"
    >
      <div className="w-full">
        <Body
          variant="b4"
          size="text-[12px] tablet:text-[14px]"
          weight="bold"
          className="dark:text-white"
        >
          {name}&nbsp;&nbsp;
          <span className="dark:text-neutral-500 font-normal">{`@${username}`}</span>
        </Body>
        <Body
          variant="b4"
          size="mt-0.5 text-[12px] tablet:text-[14px]"
          className="dark:text-neutral-400"
        >
          {createdDate} {editedAt !== createdAt && "(Edited)"}
        </Body>

        {editComment ? (
          <EditCommentForm
            comment={comment}
            post={post}
            setEditComment={setEditComment}
          />
        ) : (
          <div className="w-full">
            <Markdown
              options={{ forceBlock: true }}
              className="max-w-full w-full mt-4 prose dark:prose-invert tablet:text-[14px] text-[12px]"
            >
              {text.length <= 300
                ? text
                : readMore
                ? text
                : text.slice(0, 300) + "..."}
            </Markdown>
            {text.length > 300 && (
              <Button
                onClick={() => setReadMore(!readMore)}
                padding="pt-2"
                bgColor="bg-transparent"
                hoverBgColor="hover:bg-transparent"
                clickedBgColor="active:bg-transparent"
                className="group"
              >
                <Body
                  variant="b3"
                  size="text-[12px] tablet:text-[14px]"
                  className="dark:text-neutral-400 dark:group-hover:underline"
                >
                  {readMore ? "Show less" : "Read more"}
                </Body>
              </Button>
            )}
            {user && <ReplyForm comment={comment} post={post} />}
          </div>
        )}
        {replyCount !== 0 && !comment.parentId && (
          <div>
            {loadStatus !== "LOADING" && (
              <Button
                onClick={async () => {
                  setShowReplies(!showReplies)

                  if (!replies) {
                    await fetchReplies()
                  }
                }}
                padding="tablet:pt-2"
                bgColor="bg-transparent"
                hoverBgColor="hover:bg-transparent"
                clickedBgColor="active:bg-transparent"
                className="my-2 group"
              >
                <Body
                  variant="b3"
                  size="text-[14px] tablet:text-[16px]"
                  className="text-blue-500 group-hover:text-blue-400 group-active:text-blue-300"
                >
                  {showReplies
                    ? "Hide replies"
                    : `Show ${replyCount} ${
                        replyCount === 1 ? "reply" : "replies"
                      }`}
                </Body>
              </Button>
            )}
            {loadStatus === "LOADING" && (
              <Body
                variant="b3"
                size="text-[12px] tablet:text-[14px]"
                className="mt-2 dark:text-neutral-400"
              >
                Loading...
              </Body>
            )}
          </div>
        )}
        <div className="flex flex-col w-full">
          {showReplies &&
            replies &&
            replies.map((reply, index) => (
              <div
                key={index + comment.comment}
                className="border-l-2 dark:border-neutral-500 pl-2.5 py-2 w-full"
              >
                <Comment replyCount={replyCount} comment={reply} post={post} />
              </div>
            ))}
          {showReplies && hasNextPage && (
            <Button
              onClick={fetchReplies}
              padding="pt-4"
              bgColor="bg-transparent"
              hoverBgColor="hover:bg-transparent"
              clickedBgColor="active:bg-transparent"
              className="my-2 group w-full"
            >
              <Body
                variant="b3"
                size="text-[14px] tablet:text-[16px]"
                className="text-blue-500 group-hover:text-blue-400 group-active:text-blue-300"
              >
                Show more replies
              </Body>
            </Button>
          )}
        </div>
      </div>

      {/* Edit and delete section */}
      {!readMore &&
        !showReplies &&
        user &&
        user.username === username &&
        !editComment && (
          <div className="flex flex-col gap-8">
            <Button
              onClick={deleteComment}
              padding=""
              bgColor="bg-transparent"
              hoverBgColor="hover:bg-transparent"
              clickedBgColor="active:bg-transparent"
              className="group"
            >
              <DeleteIcon className="duration-500 dark:fill-red-500 dark:group-hover:fill-red-400 w-6 h-6" />
            </Button>
            <Button
              onClick={() => setEditComment(!editComment)}
              padding=""
              bgColor="bg-transparent"
              hoverBgColor="hover:bg-transparent"
              clickedBgColor="active:bg-transparent"
              className="group"
            >
              <EditIcon className="duration-500 dark:fill-neutral-500 dark:group-hover:fill-neutral-400 w-5 h-5" />
            </Button>
          </div>
        )}
    </section>
  )
}

export { Comment }
