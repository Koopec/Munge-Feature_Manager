import java.io.*;
import java.net.*;
import java.util.Scanner;
import java.util.concurrent.CopyOnWriteArrayList;

public class Server {
    private static CopyOnWriteArrayList<ClientHandler> clients = new CopyOnWriteArrayList<>();

    public static void main(String[] args) {
        try {
            PrintWriter logWriter = new PrintWriter(new FileWriter("server.log", true));
            ServerSocket serverSocket = new ServerSocket(1234);
            System.out.println("Server is running and waiting for connections ...");

            new Thread(() -> {
                Scanner scanner = new Scanner(System.in);
                while (true) {
                    String serverMessage = scanner.nextLine();
                    broadcast("[Server]: " + serverMessage, null);
                }
            }).start();

            while (true) {
                Socket clientSocket = serverSocket.accept();
                System.out.println("New client connected: " + clientSocket);

                ClientHandler clientHandler = new ClientHandler(clientSocket, logWriter);
                clients.add(clientHandler);
                new Thread(clientHandler).start();
            }
        } catch (IOException e) {
            System.out.println(e);
        }
    }

    public static void broadcast(String message, ClientHandler sender) {
        for (ClientHandler client : clients) {
            if (client != sender) {
                client.sendMessage(message);
            }
        }
    }

    private static void logMessage(PrintWriter logWriter, String message) {
        logWriter.println(message);
        logWriter.flush();
    }

    private static class ClientHandler implements Runnable {
        private Socket clientSocket;
        private PrintWriter out;
        private BufferedReader in;
        private String username;
        private PrintWriter logWriter;

        public ClientHandler(Socket socket, PrintWriter logWriter) {
            this.clientSocket = socket;
            this.logWriter = logWriter;

            try {
                out = new PrintWriter(clientSocket.getOutputStream(), true);
                in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
            } catch (IOException e) {
                System.out.println(e);
            }
        }

        @Override
        public void run() {
            try {
                out.println("Send your special message:");
                while(!in.readLine().equals("Software Product Lines")) {}

                out.println("Enter your username:");
                username = in.readLine();
                System.out.println("User " + username + " connected.");
                out.println("Welcome to the chat, " + username + "!");

                out.println("What color do you want your outgoing messages to be?");
                // TODO
                out.println("Type your message:");

                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    System.out.println("[" + username + "]: " + inputLine);
                    broadcast("[" + username + "]: " + inputLine, this);
                    logMessage(logWriter, "[" + username + "]: " + inputLine);
                }

                clients.remove(this);
                System.out.println("User " + username + " disconnected.");
            } catch (IOException e) {
                System.out.println(e);
            } finally {
                try {
                    in.close();
                    out.close();
                    clientSocket.close();
                } catch (IOException e) {
                    System.out.println(e);
                }
            }
        }

        public void sendMessage(String message) {
            out.println(message);
        }
    }
}