import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import Login from "./Login";
import ResetPassword from "./ResetPassword";
import Signup from "./Signup";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  AiFillLike,
  AiFillDislike,
  AiOutlineLoading3Quarters,
  AiFillStar,
} from "react-icons/ai";
import { BsCheck2Circle } from "react-icons/bs";
import { TiStarOutline } from "react-icons/ti";
import { toast } from "react-toastify";
import Image from "next/image";
import CircleSkeleton from "@/components/Skeletons/CircleSkeleton";
import RectangleSkeleton from "@/components/Skeletons/RectangleSkeleton";
import { auth, firestore } from "@/firebase/firebase";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  runTransaction,
  updateDoc,
} from "firebase/firestore";

type Example = {
  id: string;
  inputText: string;
  outputText: string;
  explanation?: string;
  img?: string;
};

type Problem = {
  id: string;
  title: string;
  problemStatement: string;
  examples: Example[];
  constraints: string;
};

type DBProblem = {
  id: string;
  title: string;
  problemStatement: string;
  difficulty: string;
};

type ProblemDescriptionProps = {
  problem: Problem;
  _solved: boolean;
};

const ProblemDescription: React.FC<ProblemDescriptionProps> = ({
  problem,
  _solved,
}) => {
  const [user] = useAuthState(auth);
  const [currentProblem, setCurrentProblem] = useState<DBProblem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [problemDifficultyClass, setProblemDifficultyClass] =
    useState<string>("");
  const [liked, setLiked] = useState<boolean>(false);
  const [disliked, setDisliked] = useState<boolean>(false);
  const [starred, setStarred] = useState<boolean>(false);
  const [solved, setSolved] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    const getCurrentProblem = async () => {
      setLoading(true);
      const docRef = doc(firestore, "problems", problem.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const problemData = docSnap.data();
        setCurrentProblem({ id: docSnap.id, ...problemData } as DBProblem);
        setProblemDifficultyClass(
          problemData.difficulty === "Easy"
            ? "bg-olive text-olive"
            : problemData.difficulty === "Medium"
            ? "bg-dark-yellow text-dark-yellow"
            : " bg-dark-pink text-dark-pink"
        );
      }
      setLoading(false);
    };
    getCurrentProblem();
  }, [problem.id]);

  useEffect(() => {
    const getUsersDataOnProblem = async () => {
      if (!user) return;
      const userRef = doc(firestore, "users", user!.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setLiked(userData.likedProblems.includes(problem.id));
        setDisliked(userData.dislikedProblems.includes(problem.id));
        setStarred(userData.starredProblems.includes(problem.id));
        setSolved(userData.solvedProblems.includes(problem.id));
      }
    };
    getUsersDataOnProblem();
  }, [user, problem.id]);

  const returnUserDataAndProblemData = async (transaction: any) => {
    const userRef = doc(firestore, "users", user!.uid);
    const problemRef = doc(firestore, "problems", problem.id);
    const userDoc = await transaction.get(userRef);
    const problemDoc = await transaction.get(problemRef);
    return { userDoc, problemDoc, userRef, problemRef };
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("You must be logged in to like a problem", {
        position: "top-left",
        theme: "dark",
      });
      return;
    }
    if (updating) return;
    setUpdating(true);
    await runTransaction(firestore, async (transaction) => {
      const { problemDoc, userDoc, problemRef, userRef } =
        await returnUserDataAndProblemData(transaction);

      if (userDoc.exists() && problemDoc.exists()) {
        if (liked) {
          transaction.update(userRef, {
            likedProblems: userDoc
              .data()
              .likedProblems.filter((id: string) => id !== problem.id),
          });
          transaction.update(problemRef, {
            likes: problemDoc.data().likes - 1,
          });
          setLiked(false);
        } else if (disliked) {
          transaction.update(userRef, {
            likedProblems: [...userDoc.data().likedProblems, problem.id],
            dislikedProblems: userDoc
              .data()
              .dislikedProblems.filter((id: string) => id !== problem.id),
          });
          transaction.update(problemRef, {
            likes: problemDoc.data().likes + 1,
            dislikes: problemDoc.data().dislikes - 1,
          });
          setLiked(true);
          setDisliked(false);
        } else {
          transaction.update(userRef, {
            likedProblems: [...userDoc.data().likedProblems, problem.id],
          });
          transaction.update(problemRef, {
            likes: problemDoc.data().likes + 1,
          });
          setLiked(true);
        }
      }
    });
    setUpdating(false);
  };

  const handleDislike = async () => {
    if (!user) {
      toast.error("You must be logged in to dislike a problem", {
        position: "top-left",
        theme: "dark",
      });
      return;
    }
    if (updating) return;
    setUpdating(true);
    await runTransaction(firestore, async (transaction) => {
      const { problemDoc, userDoc, problemRef, userRef } =
        await returnUserDataAndProblemData(transaction);
      if (userDoc.exists() && problemDoc.exists()) {
        if (disliked) {
          transaction.update(userRef, {
            dislikedProblems: userDoc
              .data()
              .dislikedProblems.filter((id: string) => id !== problem.id),
          });
          transaction.update(problemRef, {
            dislikes: problemDoc.data().dislikes - 1,
          });
          setDisliked(false);
        } else if (liked) {
          transaction.update(userRef, {
            dislikedProblems: [...userDoc.data().dislikedProblems, problem.id],
            likedProblems: userDoc
              .data()
              .likedProblems.filter((id: string) => id !== problem.id),
          });
          transaction.update(problemRef, {
            dislikes: problemDoc.data().dislikes + 1,
            likes: problemDoc.data().likes - 1,
          });
          setDisliked(true);
          setLiked(false);
        } else {
          transaction.update(userRef, {
            dislikedProblems: [...userDoc.data().dislikedProblems, problem.id],
          });
          transaction.update(problemRef, {
            dislikes: problemDoc.data().dislikes + 1,
          });
          setDisliked(true);
        }
      }
    });
    setUpdating(false);
  };

  const handleStar = async () => {
    if (!user) {
      toast.error("You must be logged in to star a problem", {
        position: "top-left",
        theme: "dark",
      });
      return;
    }
    if (updating) return;
    setUpdating(true);

    const userRef = doc(firestore, "users", user.uid);
    const starAction = starred ? arrayRemove : arrayUnion;
    await updateDoc(userRef, {
      starredProblems: starAction(problem.id),
    });
    setStarred(!starred);

    setUpdating(false);
  };

  return (
    <div className="bg-dark-layer-1">
      <div className="flex h-11 w-full items-center pt-2 bg-dark-layer-2 text-white overflow-x-hidden">
        <div
          className={
            "bg-dark-layer-1 rounded-t-[5px] px-5 py-[10px] text-xs cursor-pointer"
          }
        >
          Description
        </div>
      </div>

      <div className="flex px-0 py-4 h-[calc(100vh-94px)] overflow-y-auto">
        <div className="px-5">
          <div className="w-full">
            <div className="flex space-x-4">
              <div className="flex-1 mr-2 text-lg text-white font-medium">
                {problem?.title}
              </div>
            </div>
            {!loading && currentProblem && (
              <div className="flex items-center mt-3">
                <div
                  className={`${problemDifficultyClass} inline-block rounded-[21px] bg-opacity-[.15] px-2.5 py-1 text-xs font-medium capitalize `}
                >
                  {currentProblem.difficulty}
                </div>
                {(solved || _solved) && (
                  <div className="rounded p-[3px] ml-4 text-lg transition-colors duration-200 text-green-s text-dark-green-s">
                    <BsCheck2Circle />
                  </div>
                )}
                <div
                  className="flex items-center cursor-pointer hover:bg-dark-fill-3 space-x-1 rounded p-[3px]  ml-4 text-lg transition-colors duration-200 text-dark-gray-6"
                  onClick={handleLike}
                >
                  {liked && !updating && (
                    <AiFillLike className="text-dark-blue-s" />
                  )}
                  {!liked && !updating && <AiFillLike />}
                  {updating && (
                    <AiOutlineLoading3Quarters className="animate-spin" />
                  )}
                  <span className="text-xs">{currentProblem.likes}</span>
                </div>
                <div
                  className="flex items-center cursor-pointer hover:bg-dark-fill-3 space-x-1 rounded p-[3px]  ml-4 text-lg transition-colors duration-200 text-green-s text-dark-gray-6"
                  onClick={handleDislike}
                >
                  {disliked && !updating && (
                    <AiFillDislike className="text-dark-blue-s" />
                  )}
                  {!disliked && !updating && <AiFillDislike />}
                  {updating && (
                    <AiOutlineLoading3Quarters className="animate-spin" />
                  )}
                  <span className="text-xs">{currentProblem.dislikes}</span>
                </div>
                <div
                  className="cursor-pointer hover:bg-dark-fill-3  rounded p-[3px]  ml-4 text-xl transition-colors duration-200 text-green-s text-dark-gray-6 "
                  onClick={handleStar}
                >
                  {starred && !updating && (
                    <AiFillStar className="text-dark-yellow" />
                  )}
                  {!starred && !updating && <TiStarOutline />}
                  {updating && (
                    <AiOutlineLoading3Quarters className="animate-spin" />
                  )}
                </div>
              </div>
            )}

            {loading && (
              <div className="mt-3 flex space-x-2">
                <RectangleSkeleton />
                <CircleSkeleton />
                <RectangleSkeleton />
                <RectangleSkeleton />
                <CircleSkeleton />
              </div>
            )}

            <div className="text-white text-sm">
              <div
                dangerouslySetInnerHTML={{ __html: problem.problemStatement }}
              />
            </div>

            <div className="mt-4">
              {problem.examples.map((example, index) => (
                <div key={example.id}>
                  <p className="font-medium text-white ">
                    Example {index + 1}:{" "}
                  </p>
                  {example.img && (
                    <Image
                      src={example.img}
                      alt=""
                      width={200}
                      height={200}
                      className="mt-3"
                    />
                  )}
                  <div className="example-card">
                    <pre>
                      <strong className="text-white">Input: </strong>{" "}
                      {example.inputText}
                      <br />
                      <strong>Output:</strong>
                      {example.outputText} <br />
                      {example.explanation && (
                        <>
                          <strong>Explanation:</strong> {example.explanation}
                        </>
                      )}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            <div className="my-8 pb-4">
              <div className="text-white text-sm font-medium">Constraints:</div>
              <ul className="text-white ml-5 list-disc ">
                <div
                  dangerouslySetInnerHTML={{ __html: problem.constraints }}
                />
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDescription;
