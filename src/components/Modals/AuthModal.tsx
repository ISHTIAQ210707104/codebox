import React, { useEffect, useCallback } from "react";
import { IoClose } from "react-icons/io5";
import Login from "./Login";
import ResetPassword from "./ResetPassword";
import Signup from "./Signup";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtoms";

type AuthModalProps = {};

const AuthModal: React.FC<AuthModalProps> = () => {
  const authModal = useRecoilValue(authModalState);
  const setAuthModal = useSetRecoilState(authModalState);

  const closeModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, isOpen: false, type: "login" }));
  }, [setAuthModal]); // Include setAuthModal in the dependency array

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeModal]); // Include closeModal in the dependency array

  return (
    <>
      {authModal.isOpen && (
        <>
          <div
            className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60"
            onClick={closeModal}
          ></div>
          <div className="w-full sm:w-[450px] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center items-center">
            <div className="relative w-full h-full mx-auto flex items-center justify-center">
              <div className="bg-white rounded-lg shadow relative w-full bg-gradient-to-b from-brand-orange to-slate-900 mx-6">
                <div className="flex justify-end p-2">
                  <button
                    type="button"
                    className="bg-transparent rounded-lg text-sm p-1.5 ml-auto inline-flex items-center hover:bg-gray-800 hover:text-white text-white"
                    onClick={closeModal}
                  >
                    <IoClose className="h-5 w-5" />
                  </button>
                </div>
                {authModal.type === "login" ? (
                  <Login />
                ) : authModal.type === "register" ? (
                  <Signup />
                ) : (
                  <ResetPassword />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AuthModal;
