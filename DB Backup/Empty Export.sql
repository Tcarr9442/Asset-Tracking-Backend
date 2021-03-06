USE [master] 
GO 
/****** Object:  Database [Tracker]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE DATABASE [Tracker] 
CONTAINMENT = NONE 
WITH CATALOG_COLLATION = DATABASE_DEFAULT 
GO 
ALTER DATABASE [Tracker] SET COMPATIBILITY_LEVEL = 150 
GO 
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled')) 
begin 
EXEC [Tracker].[dbo].[sp_fulltext_database] @action = 'enable' 
end 
GO 
  
/** 
This part was created by Thomas, rest was auto generated from ssms 
**/ 
CREATE LOGIN NodeExpress 
WITH PASSWORD = 'PASSWORD', 
DEFAULT_DATABASE = [Tracker] 
GO 
  
  
  
  
  
ALTER DATABASE [Tracker] SET ANSI_NULL_DEFAULT OFF  
GO 
ALTER DATABASE [Tracker] SET ANSI_NULLS OFF  
GO 
ALTER DATABASE [Tracker] SET ANSI_PADDING OFF  
GO 
ALTER DATABASE [Tracker] SET ANSI_WARNINGS OFF  
GO 
ALTER DATABASE [Tracker] SET ARITHABORT OFF  
GO 
ALTER DATABASE [Tracker] SET AUTO_CLOSE OFF  
GO 
ALTER DATABASE [Tracker] SET AUTO_SHRINK OFF  
GO 
ALTER DATABASE [Tracker] SET AUTO_UPDATE_STATISTICS ON  
GO 
ALTER DATABASE [Tracker] SET CURSOR_CLOSE_ON_COMMIT OFF  
GO 
ALTER DATABASE [Tracker] SET CURSOR_DEFAULT  GLOBAL  
GO 
ALTER DATABASE [Tracker] SET CONCAT_NULL_YIELDS_NULL OFF  
GO 
ALTER DATABASE [Tracker] SET NUMERIC_ROUNDABORT OFF  
GO 
ALTER DATABASE [Tracker] SET QUOTED_IDENTIFIER OFF  
GO 
ALTER DATABASE [Tracker] SET RECURSIVE_TRIGGERS OFF  
GO 
ALTER DATABASE [Tracker] SET  DISABLE_BROKER  
GO 
ALTER DATABASE [Tracker] SET AUTO_UPDATE_STATISTICS_ASYNC OFF  
GO 
ALTER DATABASE [Tracker] SET DATE_CORRELATION_OPTIMIZATION OFF  
GO 
ALTER DATABASE [Tracker] SET TRUSTWORTHY OFF  
GO 
ALTER DATABASE [Tracker] SET ALLOW_SNAPSHOT_ISOLATION OFF  
GO 
ALTER DATABASE [Tracker] SET PARAMETERIZATION SIMPLE  
GO 
ALTER DATABASE [Tracker] SET READ_COMMITTED_SNAPSHOT OFF  
GO 
ALTER DATABASE [Tracker] SET HONOR_BROKER_PRIORITY OFF  
GO 
ALTER DATABASE [Tracker] SET RECOVERY FULL  
GO 
ALTER DATABASE [Tracker] SET  MULTI_USER  
GO 
ALTER DATABASE [Tracker] SET PAGE_VERIFY CHECKSUM   
GO 
ALTER DATABASE [Tracker] SET DB_CHAINING OFF  
GO 
ALTER DATABASE [Tracker] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF )  
GO 
ALTER DATABASE [Tracker] SET TARGET_RECOVERY_TIME = 60 SECONDS  
GO 
ALTER DATABASE [Tracker] SET DELAYED_DURABILITY = DISABLED  
GO 
ALTER DATABASE [Tracker] SET ACCELERATED_DATABASE_RECOVERY = OFF   
GO 
EXEC sys.sp_db_vardecimal_storage_format N'Tracker', N'ON' 
GO 
ALTER DATABASE [Tracker] SET QUERY_STORE = OFF 
GO 
USE [Tracker] 
GO 
/****** Object:  User [NodeExpress]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE USER [NodeExpress] FOR LOGIN [NodeExpress] WITH DEFAULT_SCHEMA=[dbo] 
GO 
  
/** From Thomas --Not scripted **/ 
ALTER ROLE [db_owner] ADD MEMBER [NodeExpress] 
GO 
  
/****** Object:  Table [dbo].[asset_tracking]    Script Date: 10/12/2021 2:11:13 PM ******/ 
SET ANSI_NULLS ON 
GO 
SET QUOTED_IDENTIFIER ON 
GO 
CREATE TABLE [dbo].[asset_tracking]( 
[id] [int] IDENTITY(1,1) NOT NULL, 
[user_id] [int] NOT NULL, 
[asset_id] [varchar](50) NULL, 
[job_code] [int] NOT NULL, 
[date] [date] NOT NULL, 
[notes] [text] NULL, 
CONSTRAINT [PK_asset tracking] PRIMARY KEY CLUSTERED  
( 
[id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY] 
GO 
/****** Object:  Table [dbo].[assets]    Script Date: 10/12/2021 2:11:13 PM ******/ 
SET ANSI_NULLS ON 
GO 
SET QUOTED_IDENTIFIER ON 
GO 
CREATE TABLE [dbo].[assets]( 
[id] [varchar](50) NOT NULL, 
[status] [int] NOT NULL, 
[model_number] [varchar](50) NOT NULL, 
[return_reason] [text] NULL, 
[notes] [text] NULL, 
CONSTRAINT [PK_assets] PRIMARY KEY CLUSTERED  
( 
[id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY] 
GO 
/****** Object:  Table [dbo].[history]    Script Date: 10/12/2021 2:11:13 PM ******/ 
SET ANSI_NULLS ON 
GO 
SET QUOTED_IDENTIFIER ON 
GO 
CREATE TABLE [dbo].[history]( 
[id] [int] IDENTITY(1,1) NOT NULL, 
[asset_id] [varchar](50) NULL, 
[old_status] [int] NULL, 
[new_status] [int] NULL, 
[user] [int] NOT NULL, 
[time] [datetime] NOT NULL, 
[ip_address] [varchar](255) NULL, 
[route] [varchar](255) NULL, 
[body] [text] NULL, 
CONSTRAINT [PK_history] PRIMARY KEY CLUSTERED  
( 
[id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY] 
GO 
/****** Object:  Table [dbo].[hourly_tracking]    Script Date: 10/12/2021 2:11:13 PM ******/ 
SET ANSI_NULLS ON 
GO 
SET QUOTED_IDENTIFIER ON 
GO 
CREATE TABLE [dbo].[hourly_tracking]( 
[id] [int] IDENTITY(1,1) NOT NULL, 
[job_code] [int] NOT NULL, 
[user_id] [int] NOT NULL, 
[start_time] [time](7) NOT NULL, 
[end_time] [time](7) NOT NULL, 
[notes] [text] NULL, 
[hours] [decimal](4, 2) NULL, 
[date] [date] NOT NULL, 
CONSTRAINT [PK_hourly tracking] PRIMARY KEY CLUSTERED  
( 
[id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY] 
GO 
/****** Object:  Table [dbo].[jobs]    Script Date: 10/12/2021 2:11:13 PM ******/ 
SET ANSI_NULLS ON 
GO 
SET QUOTED_IDENTIFIER ON 
GO 
CREATE TABLE [dbo].[jobs]( 
[id] [int] IDENTITY(1,1) NOT NULL, 
[job_code] [varchar](50) NOT NULL, 
[is_hourly] [tinyint] NOT NULL, 
[price] [decimal](13, 4) NOT NULL, 
[job_name] [varchar](255) NOT NULL, 
[status_only] [tinyint] NULL, 
CONSTRAINT [PK_job codes] PRIMARY KEY CLUSTERED  
( 
[id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
) ON [PRIMARY] 
GO 
/****** Object:  Table [dbo].[models]    Script Date: 10/12/2021 2:11:13 PM ******/ 
SET ANSI_NULLS ON 
GO 
SET QUOTED_IDENTIFIER ON 
GO 
CREATE TABLE [dbo].[models]( 
[model_number] [varchar](50) NOT NULL, 
[name] [varchar](50) NOT NULL, 
[category] [varchar](50) NOT NULL, 
[image] [text] NULL, 
[manufacturer] [varchar](50) NOT NULL, 
CONSTRAINT [PK_models] PRIMARY KEY CLUSTERED  
( 
[model_number] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY] 
GO 
/****** Object:  Table [dbo].[user_permissions]    Script Date: 10/12/2021 2:11:13 PM ******/ 
SET ANSI_NULLS ON 
GO 
SET QUOTED_IDENTIFIER ON 
GO 
CREATE TABLE [dbo].[user_permissions]( 
[id] [int] NOT NULL, 
[view_jobcodes] [tinyint] NOT NULL, 
[edit_jobcodes] [tinyint] NOT NULL, 
[view_users] [tinyint] NOT NULL, 
[edit_users] [tinyint] NOT NULL, 
[use_importer] [tinyint] NOT NULL, 
[view_reports] [tinyint] NOT NULL, 
[view_models] [tinyint] NULL, 
[edit_models] [tinyint] NULL, 
[view_assets] [tinyint] NULL, 
[edit_assets] [tinyint] NULL, 
[use_hourly_tracker] [tinyint] NULL, 
[use_asset_tracker] [tinyint] NULL, 
[edit_others_worksheets] [tinyint] NULL, 
CONSTRAINT [PK_108] PRIMARY KEY CLUSTERED  

 
[id] ASC 

WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
) ON [PRIMARY] 
GO 
/****** Object:  Table [dbo].[users]    Script Date: 10/12/2021 2:11:13 PM ******/ 
SET ANSI_NULLS ON 
GO 
SET QUOTED_IDENTIFIER ON 
GO 
CREATE TABLE [dbo].[users]( 
[id] [int] IDENTITY(1,1) NOT NULL, 
[username] [varchar](50) NOT NULL, 
[is_dark_theme] [tinyint] NOT NULL, 
[is_admin] [tinyint] NOT NULL, 
[email] [varchar](50) NOT NULL, 
[title] [varchar](50) NOT NULL, 
[name] [varchar](255) NOT NULL, 
CONSTRAINT [PK_users] PRIMARY KEY CLUSTERED  
( 
[id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
) ON [PRIMARY] 
GO 
/****** Object:  Index [fkIdx_61]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_61] ON [dbo].[asset_tracking] 
( 
[job_code] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
SET ANSI_PADDING ON 
GO 
/****** Object:  Index [fkIdx_66]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_66] ON [dbo].[asset_tracking] 
( 
[asset_id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
/****** Object:  Index [fkIdx_70]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_70] ON [dbo].[asset_tracking] 
( 
[user_id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
SET ANSI_PADDING ON 
GO 
/****** Object:  Index [fkIdx_19]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_19] ON [dbo].[assets] 
( 
[model_number] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
/****** Object:  Index [fkIdx_26]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_26] ON [dbo].[assets] 
( 
[status] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
/****** Object:  Index [fkIdx_43]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_43] ON [dbo].[history] 
( 
[user] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
/****** Object:  Index [fkIdx_46]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_46] ON [dbo].[history] 
( 
[new_status] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
/****** Object:  Index [fkIdx_49]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_49] ON [dbo].[history] 
( 
[old_status] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
SET ANSI_PADDING ON 
GO 
/****** Object:  Index [fkIdx_57]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_57] ON [dbo].[history] 
( 
[asset_id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
/****** Object:  Index [fkIdx_73]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_73] ON [dbo].[hourly_tracking] 
( 
[user_id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
/****** Object:  Index [fkIdx_77]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_77] ON [dbo].[hourly_tracking] 
( 
[job_code] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
/****** Object:  Index [fkIdx_107]    Script Date: 10/12/2021 2:11:13 PM ******/ 
CREATE NONCLUSTERED INDEX [fkIdx_107] ON [dbo].[user_permissions] 
( 
[id] ASC 
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY] 
GO 
ALTER TABLE [dbo].[jobs] ADD  DEFAULT ((0)) FOR [status_only] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  CONSTRAINT [DF_user_permissions_view_jobcodes]  DEFAULT ((0)) FOR [view_jobcodes] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  CONSTRAINT [DF_user_permissions_edit_jobcodes]  DEFAULT ((0)) FOR [edit_jobcodes] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  CONSTRAINT [DF_user_permissions_view_users]  DEFAULT ((0)) FOR [view_users] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  CONSTRAINT [DF_user_permissions_edit_users]  DEFAULT ((0)) FOR [edit_users] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  CONSTRAINT [DF_user_permissions_use_importer]  DEFAULT ((0)) FOR [use_importer] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  CONSTRAINT [DF_user_permissions_view_reports]  DEFAULT ((0)) FOR [view_reports] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  DEFAULT ((0)) FOR [view_models] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  DEFAULT ((0)) FOR [edit_models] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  DEFAULT ((0)) FOR [view_assets] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  DEFAULT ((0)) FOR [edit_assets] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  DEFAULT ((1)) FOR [use_hourly_tracker] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  DEFAULT ((1)) FOR [use_asset_tracker] 
GO 
ALTER TABLE [dbo].[user_permissions] ADD  DEFAULT ((0)) FOR [edit_others_worksheets] 
GO 
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [DF_Users_is_dark_theme]  DEFAULT ((1)) FOR [is_dark_theme] 
GO 
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [DF_Users_is_admin]  DEFAULT ((0)) FOR [is_admin] 
GO 
ALTER TABLE [dbo].[asset_tracking]  WITH CHECK ADD  CONSTRAINT [FK_job_code] FOREIGN KEY([job_code]) 
REFERENCES [dbo].[jobs] ([id]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[asset_tracking] CHECK CONSTRAINT [FK_job_code] 
GO 
ALTER TABLE [dbo].[asset_tracking]  WITH CHECK ADD  CONSTRAINT [FK_asset_id] FOREIGN KEY([asset_id]) 
REFERENCES [dbo].[assets] ([id]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[asset_tracking] CHECK CONSTRAINT [FK_asset_id] 
GO 
ALTER TABLE [dbo].[asset_tracking]  WITH CHECK ADD  CONSTRAINT [FK_user_id] FOREIGN KEY([user_id]) 
REFERENCES [dbo].[users] ([id]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[asset_tracking] CHECK CONSTRAINT [FK_user_id] 
GO 
ALTER TABLE [dbo].[assets]  WITH CHECK ADD  CONSTRAINT [FK_model_number] FOREIGN KEY([model_number]) 
REFERENCES [dbo].[models] ([model_number]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[assets] CHECK CONSTRAINT [FK_model_number] 
GO 
ALTER TABLE [dbo].[assets]  WITH CHECK ADD  CONSTRAINT [FK_status] FOREIGN KEY([status]) 
REFERENCES [dbo].[jobs] ([id]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[assets] CHECK CONSTRAINT [FK_status] 
GO 
ALTER TABLE [dbo].[history]  WITH CHECK ADD  CONSTRAINT [FK_h_user_id] FOREIGN KEY([user]) 
REFERENCES [dbo].[users] ([id]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[history] CHECK CONSTRAINT [FK_h_user_id] 
GO 
ALTER TABLE [dbo].[history]  WITH CHECK ADD  CONSTRAINT [FK_h_new_status] FOREIGN KEY([new_status]) 
REFERENCES [dbo].[jobs] ([id]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[history] CHECK CONSTRAINT [FK_h_new_status] 
GO 
ALTER TABLE [dbo].[history]  WITH CHECK ADD  CONSTRAINT [FK_h_old_status] FOREIGN KEY([old_status]) 
REFERENCES [dbo].[jobs] ([id]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[history] CHECK CONSTRAINT [FK_h_old_status] 
GO 
ALTER TABLE [dbo].[history]  WITH CHECK ADD  CONSTRAINT [FK_h_asset_id] FOREIGN KEY([asset_id]) 
REFERENCES [dbo].[assets] ([id]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[history] CHECK CONSTRAINT [FK_h_asset_id] 
GO 
ALTER TABLE [dbo].[hourly_tracking]  WITH CHECK ADD  CONSTRAINT [FK_hrly_user_id] FOREIGN KEY([user_id]) 
REFERENCES [dbo].[users] ([id]) 
ON DELETE NO ACTION
ON UPDATE CASCADE
GO 
ALTER TABLE [dbo].[hourly_tracking] CHECK CONSTRAINT [FK_hrly_user_id] 
GO 
ALTER TABLE [dbo].[hourly_tracking]  WITH CHECK ADD  CONSTRAINT [FK_hrly_job_code] FOREIGN KEY([job_code]) 
REFERENCES [dbo].[jobs] ([id]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[hourly_tracking] CHECK CONSTRAINT [FK_hrly_job_code] 
GO 
ALTER TABLE [dbo].[user_permissions]  WITH CHECK ADD  CONSTRAINT [FK_u_id] FOREIGN KEY([id]) 
REFERENCES [dbo].[users] ([id]) 
ON UPDATE CASCADE
ON DELETE NO ACTION
GO 
ALTER TABLE [dbo].[user_permissions] CHECK CONSTRAINT [FK_u_id] 
GO 
USE [master] 
GO 
ALTER DATABASE [Tracker] SET  READ_WRITE  
GO 