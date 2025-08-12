import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth"
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { auth, db } from "./firebase-config"

export interface UserProfile {
  uid: string
  email: string
  firstName: string
  lastName: string
  phone: string
  country: string
  balance: number
  totalInvested: number
  totalEarnings: number
  isVerified: boolean
  verificationStatus: "pending" | "approved" | "rejected" | "none"
  createdAt: Date
  lastLogin: Date
  role: "user" | "admin"
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  country: string
}

export interface LoginData {
  email: string
  password: string
}

export interface Transaction {
  id?: string
  userId: string
  type: "deposit" | "withdrawal" | "investment" | "earnings"
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "cancelled"
  description: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export interface Investment {
  id?: string
  userId: string
  planId: string
  planName: string
  amount: number
  duration: number // in days
  interestRate: number
  expectedReturn: number
  status: "active" | "completed" | "cancelled"
  startDate: Date
  endDate: Date
  createdAt: Date
}

class UserService {
  private currentUser: User | null = null

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user
      if (user) {
        this.updateLastLogin(user.uid)
      }
    })
  }

  // Register new user
  async register(data: RegisterData): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        country: data.country,
        balance: 0,
        totalInvested: 0,
        totalEarnings: 0,
        isVerified: false,
        verificationStatus: "none",
        createdAt: new Date(),
        lastLogin: new Date(),
        role: "user",
      }

      await setDoc(doc(db, "users", user.uid), userProfile)

      return { success: true, user: userProfile }
    } catch (error: any) {
      console.error("Registration error:", error)
      return {
        success: false,
        message: this.getErrorMessage(error.code),
      }
    }
  }

  // Login user
  async login(data: LoginData): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const userProfile = userDoc.data() as UserProfile
        await this.updateLastLogin(user.uid)
        return { success: true, user: userProfile }
      } else {
        return { success: false, message: "User profile not found" }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      return {
        success: false,
        message: this.getErrorMessage(error.code),
      }
    }
  }

  // Logout user
  async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      await signOut(auth)
      this.currentUser = null
      return { success: true }
    } catch (error: any) {
      console.error("Logout error:", error)
      return { success: false, message: "Failed to logout" }
    }
  }

  // Get current user
  async getCurrentUser(): Promise<UserProfile | null> {
    if (!this.currentUser) return null

    try {
      const userDoc = await getDoc(doc(db, "users", this.currentUser.uid))
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile
      }
      return null
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  // Update user profile
  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<{ success: boolean; message?: string }> {
    try {
      await updateDoc(doc(db, "users", uid), updates)
      return { success: true }
    } catch (error: any) {
      console.error("Update profile error:", error)
      return { success: false, message: "Failed to update profile" }
    }
  }

  // Update last login
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, "users", uid), {
        lastLogin: new Date(),
      })
    } catch (error) {
      console.error("Error updating last login:", error)
    }
  }

  // Send password reset email
  async resetPassword(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true, message: "Password reset email sent" }
    } catch (error: any) {
      console.error("Password reset error:", error)
      return {
        success: false,
        message: this.getErrorMessage(error.code),
      }
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.currentUser) {
        return { success: false, message: "No user logged in" }
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(this.currentUser.email!, currentPassword)
      await reauthenticateWithCredential(this.currentUser, credential)

      // Update password
      await updatePassword(this.currentUser, newPassword)
      return { success: true, message: "Password updated successfully" }
    } catch (error: any) {
      console.error("Change password error:", error)
      return {
        success: false,
        message: this.getErrorMessage(error.code),
      }
    }
  }

  // Add transaction
  async addTransaction(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    try {
      const transactionData = {
        ...transaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "transactions"), transactionData)

      // Update user balance if transaction is completed
      if (transaction.status === "completed") {
        await this.updateUserBalance(transaction.userId, transaction.type, transaction.amount)
      }

      return { success: true, transactionId: docRef.id }
    } catch (error: any) {
      console.error("Add transaction error:", error)
      return { success: false, message: "Failed to add transaction" }
    }
  }

  // Get user transactions
  async getUserTransactions(userId: string, limitCount = 50): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Transaction[]
    } catch (error) {
      console.error("Error getting user transactions:", error)
      return []
    }
  }

  // Update user balance
  private async updateUserBalance(userId: string, transactionType: string, amount: number): Promise<void> {
    try {
      const userRef = doc(db, "users", userId)

      if (transactionType === "deposit") {
        await updateDoc(userRef, {
          balance: increment(amount),
        })
      } else if (transactionType === "withdrawal") {
        await updateDoc(userRef, {
          balance: increment(-amount),
        })
      } else if (transactionType === "investment") {
        await updateDoc(userRef, {
          balance: increment(-amount),
          totalInvested: increment(amount),
        })
      } else if (transactionType === "earnings") {
        await updateDoc(userRef, {
          balance: increment(amount),
          totalEarnings: increment(amount),
        })
      }
    } catch (error) {
      console.error("Error updating user balance:", error)
    }
  }

  // Add investment
  async addInvestment(
    investment: Omit<Investment, "id" | "createdAt">,
  ): Promise<{ success: boolean; investmentId?: string; message?: string }> {
    try {
      const investmentData = {
        ...investment,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "investments"), investmentData)

      // Add corresponding transaction
      await this.addTransaction({
        userId: investment.userId,
        type: "investment",
        amount: investment.amount,
        currency: "BRL",
        status: "completed",
        description: `Investment in ${investment.planName}`,
        metadata: { investmentId: docRef.id },
      })

      return { success: true, investmentId: docRef.id }
    } catch (error: any) {
      console.error("Add investment error:", error)
      return { success: false, message: "Failed to add investment" }
    }
  }

  // Get user investments
  async getUserInvestments(userId: string): Promise<Investment[]> {
    try {
      const q = query(collection(db, "investments"), where("userId", "==", userId), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Investment[]
    } catch (error) {
      console.error("Error getting user investments:", error)
      return []
    }
  }

  // Get error message
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "Email is already registered"
      case "auth/weak-password":
        return "Password is too weak"
      case "auth/invalid-email":
        return "Invalid email address"
      case "auth/user-not-found":
        return "User not found"
      case "auth/wrong-password":
        return "Incorrect password"
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later"
      case "auth/network-request-failed":
        return "Network error. Please check your connection"
      default:
        return "An error occurred. Please try again"
    }
  }
}

export const userService = new UserService()
