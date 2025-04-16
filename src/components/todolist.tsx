'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>(
    {}
  );

  
  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan tugas baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });
  
    if (!formValues || !formValues[0] || !formValues[1]) {
      Swal.fire('Gagal', 'Harap isi nama tugas dan deadline.', 'error');
      return;
    }
  
    const newTask: Omit<Task, 'id'> = {
      text: formValues[0],
      completed: false,
      deadline: formValues[1],
    };
  
    try {
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks((prev) => [...prev, { ...newTask, id: docRef.id }]);
  
      Swal.fire('Berhasil!', 'Tugas berhasil ditambahkan.', 'success');
    } catch (error) {
      console.error('Error menambahkan tugas:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menambahkan tugas.', 'error');
    }
  };
  
  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit tugas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${task.text}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${task.deadline}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const updatedTask = {
        ...task,
        text: formValues[0],
        deadline: formValues[1],
      };
      await updateDoc(doc(db, 'tasks', task.id), {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? updatedTask : t))
      );
      Swal.fire('Berhasil!', 'Tugas berhasil diperbarui.', 'success');
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
  
    const isCompleting = !task.completed;
  
    const result = await Swal.fire({
      title: isCompleting ? 'Tandai tugas sebagai selesai?' : 'Batalkan penyelesaian tugas?',
      text: `"${task.text}" akan ${isCompleting ? 'diselesaikan' : 'dibatalkan'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isCompleting ? 'Ya, Selesaikan' : 'Ya, Batalkan',
      cancelButtonText: 'Batal',
    });
  
    if (!result.isConfirmed) return;
  
    const updatedTask = { ...task, completed: isCompleting };
    await updateDoc(doc(db, 'tasks', id), {
      completed: updatedTask.completed,
    });
  
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? updatedTask : t))
    );
  
    Swal.fire({
      icon: 'success',
      title: isCompleting ? 'Tugas selesai!' : 'Penyelesaian dibatalkan!',
      showConfirmButton: false,
      timer: 1200,
    });
  };
  
  const deleteTask = async (id: string): Promise<void> => {
    // Menampilkan dialog konfirmasi dengan SweetAlert2
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Tidak',
    });
  
    // Jika pengguna mengklik 'Ya, Hapus!', lanjutkan dengan menghapus tugas
    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'tasks', id));
      setTasks(tasks.filter((task) => task.id !== id));
      Swal.fire('Terhapus!', 'Tugas telah dihapus.', 'success');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto mt-20 p-8 bg-purple-300 shadow-md rounded-lg">


     <h1
  className="text-4xl font-bold mb-4 text-center bg-gradient-to-r from-purple-500 to-black text-transparent bg-clip-text"
  style={{ fontFamily: 'Segoe UI Symbol, Noto Sans, monospace' }}
>
  📋 To Do List 📋
</h1>
<h2 
className="text-center font-bold "> 📋 simpan tugas kalian disini !!📋
</h2>
<div className="flex justify-center mt-10">
  <button
    onClick={addTask}
    className="bg-gray-700 text-white border-black font-bold px-2 py-2 rounded"
  >
    Tambah Tugas
  </button>
</div>
<div className="w-full max-w-3xl mx-auto mt-10 p-8 bg-white shadow-xl rounded-2xl">

<ul className="space-y-4">  
  <AnimatePresence>
    {tasks.map((task) => {
      const timeLeft = calculateTimeRemaining(task.deadline);
      const isExpired = timeLeft === 'Waktu habis!';
      const taskColor = task.completed
        ? 'bg-green-200'
        : isExpired
        ? 'bg-purple-300'
        : 'bg-red-100';

      return (
        <motion.li
          key={task.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={`flex flex-col justify-between p-5 border rounded-xl shadow ${taskColor}`} // padding & border-radius diperbesar
        >
          <span
  onClick={() => toggleTask(task.id)}
  className="cursor-pointer flex items-center gap-2 text-lg"
>
  
  <span className={task.completed ? 'line-through text-gray-500' : 'font-semibold text-gray-800'}>
   
  </span>
</span>

          <div className="flex justify-between items-center mb-2">
            <span
              onClick={() => toggleTask(task.id)}
              className={`cursor-pointer text-lg ${
                task.completed
                  ? 'line-through text-gray-500'
                  : 'font-semibold text-gray-800'
              }`}
            >
              {task.text}
            </span>
            <div className="flex items-center gap-2">
            <button
  onClick={() => toggleTask(task.id)}
  className={`text-white px-2 py-1 rounded text-sm ${
    task.completed ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
  }`}
>
  {task.completed ? '↩️ Batalkan' : '✅ Selesai'}
</button>

              <button
                onClick={() => editTask(task)}
                className="text-white px-2 py-1 rounded bg-gray-600 hover:bg-gray-800 text-sm"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-white px-2 py-1 rounded bg-red-600 hover:bg-red-800 text-sm"
              >
                🗑️ Hapus
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-700">
            Deadline: {new Date(task.deadline).toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-gray-700">
            ⏳ {timeRemaining[task.id] || 'Menghitung...'}
          </p>
        </motion.li>
      );
    })}
  </AnimatePresence>
</ul>
<ul className="space-y-4">  
  <AnimatePresence>
    {/* daftar tugas */}
  </AnimatePresence>
</ul>


</div>
</div> 
);
}
